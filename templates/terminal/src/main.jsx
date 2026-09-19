import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx';
import profile from './profile.json';
import './styles.css';

const accent = profile.site?.accent;
if (accent) document.documentElement.style.setProperty('--accent', accent);

const mode = profile.site?.mode ?? 'system';
if (mode !== 'system') document.documentElement.setAttribute('data-theme', mode);

document.documentElement.lang = 'en';
document.title = profile.seo?.title || `${profile.identity.name} — ${profile.identity.headline}`;

const meta = document.createElement('meta');
meta.name = 'description';
meta.content = profile.seo?.description || profile.bio.short;
document.head.appendChild(meta);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App profile={profile} />
  </StrictMode>
);
