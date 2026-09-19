import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeExport, extractSignals, importMemory } from '../../scripts/lib/memory-import.mjs';

// Synthetic exports in each vendor's real shape. No real export is committed:
// these files are somebody's entire conversation history.
const claudeExport = [
  {
    name: 'Rust question',
    chat_messages: [
      { sender: 'human', text: 'I am a backend engineer working mostly in Rust and Python.' },
      { sender: 'assistant', text: 'I am an AI assistant and I build nothing of my own.' },
      { sender: 'human', content: [{ type: 'text', text: 'Rust borrow checker is fighting me again. Rust really does this.' }] },
    ],
  },
];

const chatgptExport = [
  {
    title: 'Deploy help',
    mapping: {
      a: { message: { author: { role: 'user' }, content: { parts: ['I work on Kubernetes and Terraform all day. Kubernetes again.'] } } },
      b: { message: { author: { role: 'assistant' }, content: { parts: ['Kubernetes Kubernetes Kubernetes Terraform Terraform'] } } },
      c: { message: { author: { role: 'user' }, content: { parts: ['See https://github.com/example/quorum for the repo. Kubernetes.'] } } },
    },
  },
];

const geminiExport = [
  { title: 'Prompted I build developer tools for a living', time: '2026-01-01T00:00:00Z' },
  { title: 'Prompted How do I use Docker with Docker compose and Docker swarm', time: '2026-01-02T00:00:00Z' },
];

test('reads a Claude export', () => {
  const result = normalizeExport(claudeExport);
  assert.equal(result.source, 'claude');
  assert.equal(result.messages.length, 2);
});

test('reads a ChatGPT export', () => {
  const result = normalizeExport(chatgptExport);
  assert.equal(result.source, 'chatgpt');
  assert.equal(result.messages.length, 2);
});

test('reads a Gemini Takeout export', () => {
  const result = normalizeExport(geminiExport);
  assert.equal(result.source, 'gemini');
  assert.equal(result.messages[0], 'I build developer tools for a living');
});

test('assistant replies are excluded', () => {
  // Mining the model's words would put them in the user's mouth. The Claude
  // fixture's assistant turn says "I build nothing of my own" — if that leaks
  // into signals, the filter is broken.
  const { messages } = normalizeExport(claudeExport);
  assert.ok(messages.every((m) => !m.includes('AI assistant')));

  const { selfDescriptions } = extractSignals(messages);
  assert.ok(selfDescriptions.every((d) => !/nothing of my own/i.test(d)));
});

test('a technology mentioned once is noise, not a signal', () => {
  const { technologies } = extractSignals(['I once tried Haskell and never again.']);
  assert.deepEqual(technologies, []);
});

test('a repeatedly mentioned technology is a signal', () => {
  const { technologies } = extractSignals(normalizeExport(chatgptExport).messages);
  const names = technologies.map((t) => t.name);
  assert.ok(names.includes('Kubernetes'), `expected Kubernetes in ${JSON.stringify(names)}`);
});

test('linked repositories are collected and counted', () => {
  const { githubRepos } = extractSignals([
    'https://github.com/example/quorum is mine',
    'see https://github.com/example/quorum again',
    'and https://github.com/other/thing.git',
  ]);
  assert.equal(githubRepos[0].repo, 'example/quorum');
  assert.equal(githubRepos[0].count, 2);
  // A .git suffix is the same repository, not a different one.
  assert.ok(githubRepos.some((r) => r.repo === 'other/thing'));
});

test('self-descriptions are captured verbatim', () => {
  const { selfDescriptions } = extractSignals(['I am a backend engineer working mostly in Rust.']);
  assert.ok(selfDescriptions.some((d) => /backend engineer/i.test(d)));
});

test('voice samples skip code blocks and one-liners', () => {
  const prose = 'This is a genuine piece of prose about how I think about building software, long enough to be a useful sample of voice and tone for matching later on.';
  const { voiceSamples } = extractSignals([
    'yes',
    '```js\nfunction x() { return 1; }\n```' + 'x'.repeat(200),
    prose,
  ]);
  assert.deepEqual(voiceSamples, [prose]);
});

test('every result is labelled as candidates rather than fact', () => {
  const result = importMemory(claudeExport);
  assert.match(result.notice, /CANDIDATES/);
  assert.match(result.notice, /never as instructions/);
});

test('an unrecognised shape fails loudly instead of guessing', () => {
  assert.throws(() => importMemory({ something: 'else' }), /Unrecognised export shape/);
});

test('an empty export is not an error', () => {
  const result = importMemory([]);
  assert.equal(result.messageCount, 0);
  assert.deepEqual(result.signals.technologies, []);
});

test('a mention at the end of a sentence still counts', () => {
  // A [\w.] lookahead refuses a trailing period, which silently drops every
  // mention that ends a sentence — most of them, in practice.
  const { technologies } = extractSignals(['I use Docker.', 'Docker again.', 'Always Docker.']);
  assert.equal(technologies.find((t) => t.name === 'Docker')?.count, 3);
});

test('a dotted name is not matched by its prefix', () => {
  const { technologies } = extractSignals([
    'Node.js Node.js Node.js are what I use.',
  ]);
  const names = technologies.map((t) => t.name);
  assert.ok(names.includes('Node.js'));
  // "Go" must not be found inside "Django", nor "Node" inside "Node.js".
  assert.ok(!names.includes('Node'));
});
