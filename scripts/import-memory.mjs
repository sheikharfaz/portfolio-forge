#!/usr/bin/env node
/**
 * Turn an assistant data export into profile candidates.
 *
 *   node scripts/import-memory.mjs --input ~/Downloads/conversations.json
 *   node scripts/import-memory.mjs --input ~/Downloads/export-folder --out signals.json
 *
 * There is no API for Claude, ChatGPT or Gemini memory. This reads the export
 * a person downloads of their own data, and produces candidates for them to
 * confirm — never a finished profile.
 *
 * The export never leaves the machine. Nothing is uploaded, and the output
 * holds aggregates and short samples rather than a transcript.
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';

import { importMemory } from './lib/memory-import.mjs';
import { green, yellow, dim, red } from '../harness/lib/report.mjs';

const CANDIDATE_FILES = ['conversations.json', 'MyActivity.json', 'my_activity.json'];

async function findExport(inputPath) {
  const info = await stat(inputPath);
  if (info.isFile()) return inputPath;

  // Exports arrive as a folder of files; find the one that matters.
  const entries = await readdir(inputPath, { withFileTypes: true });
  for (const name of CANDIDATE_FILES) {
    const hit = entries.find((e) => e.isFile() && e.name.toLowerCase() === name.toLowerCase());
    if (hit) return join(inputPath, hit.name);
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      try {
        return await findExport(join(inputPath, entry.name));
      } catch { /* keep looking */ }
    }
  }

  throw new Error(
    `No export file found under ${inputPath}. Looking for one of: ${CANDIDATE_FILES.join(', ')}. ` +
      'If your export is a .zip, extract it first.'
  );
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, token, i, all) => {
    if (token.startsWith('--')) acc.push([token.slice(2), all[i + 1]]);
    return acc;
  }, [])
);

if (!args.input) {
  console.error(`usage: import-memory.mjs --input <export file or folder> [--out signals.json]

Where to get an export:
  Claude    Settings -> Privacy -> Export data
  ChatGPT   Settings -> Data controls -> Export data
  Gemini    takeout.google.com -> Gemini Apps

Extract the .zip first, then point --input at the folder.`);
  process.exit(2);
}

try {
  const file = await findExport(resolve(args.input));
  console.log(dim(`reading  ${file}`));

  const result = importMemory(JSON.parse(await readFile(file, 'utf8')));
  const { signals } = result;

  console.log(`\n${green('Parsed')}  ${result.source} export · ${result.messageCount} of your own messages\n`);

  if (signals.technologies.length) {
    console.log('Technologies you mention most');
    for (const { name, count } of signals.technologies.slice(0, 15)) {
      console.log(`  ${String(count).padStart(4)}x  ${name}`);
    }
  } else {
    console.log(dim('No technologies mentioned often enough to be a signal.'));
  }

  if (signals.githubRepos.length) {
    console.log('\nRepositories you linked to');
    for (const { repo, count } of signals.githubRepos.slice(0, 10)) {
      console.log(`  ${String(count).padStart(4)}x  ${repo}`);
    }
  }

  if (signals.selfDescriptions.length) {
    console.log('\nHow you have described yourself');
    for (const phrase of signals.selfDescriptions.slice(0, 8)) {
      console.log(`  ${dim('"')}${phrase}${dim('"')}`);
    }
  }

  console.log(
    `\n${yellow('These are candidates, not facts.')} ` +
      'Every one needs your confirmation before it goes anywhere near a published site.'
  );

  const out = resolve(args.out || 'memory-signals.json');
  await writeFile(out, `${JSON.stringify(result, null, 2)}\n`);
  console.log(dim(`\nwrote ${out} — stays on this machine; nothing was uploaded.`));
  console.log(dim(`${signals.voiceSamples.length} writing samples included, for matching your tone.`));
} catch (err) {
  console.error(`\n${red('Could not read that export')}\n${err.message}`);
  process.exit(1);
}
