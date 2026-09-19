import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import profile from './profile.json';
import './styles.css';

/**
 * The accent is the one visual choice a run makes, and the template derives
 * everything else from it. Applying it here rather than in CSS keeps the
 * stylesheet static and cacheable.
 */
const accent = profile.site?.accent;
if (accent) document.documentElement.style.setProperty('--accent', accent);

const mode = profile.site?.mode ?? 'system';
if (mode !== 'system') document.documentElement.setAttribute('data-theme', mode);

document.documentElement.lang = 'en';
document.title = profile.seo?.title || `${profile.identity.name} — ${profile.identity.headline}`;

const description = profile.seo?.description || profile.bio.short;
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = description;
document.head.appendChild(meta);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App profile={profile} />
  </StrictMode>
);
