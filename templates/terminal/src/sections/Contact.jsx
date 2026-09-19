import { useState } from 'react';

import Section from './Section.jsx';

/**
 * GitHub Pages is static, so a working form needs a third party. Formspree is
 * the default because its form id is public by design and needs no client
 * secret. Everything else degrades to a real address rather than to nothing.
 */
function FormspreeForm({ formspreeId, successMessage }) {
  const [state, setState] = useState('idle');

  async function onSubmit(event) {
    event.preventDefault();
    setState('sending');

    try {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        body: new FormData(event.target),
        headers: { Accept: 'application/json' },
      });
      setState(response.ok ? 'sent' : 'error');
      if (response.ok) event.target.reset();
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <p className="form-status" role="status">
        {successMessage || 'Thanks — your message is on its way.'}
      </p>
    );
  }

  return (
    <form className="contact" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="contact-name">Name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="field">
        <label htmlFor="contact-email">Email</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea id="contact-message" name="message" rows="5" required />
      </div>

      <button className="button" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send'}
      </button>

      {state === 'error' && (
        <p className="form-status" role="alert">
          That didn’t go through. Please email me directly instead.
        </p>
      )}
    </form>
  );
}

/**
 * A mailto link does nothing for someone on webmail with no desktop client, so
 * the address is always shown as copyable text beside the button.
 */
function DirectContact({ email }) {
  if (!email) return null;

  // Joined at runtime rather than sitting in the HTML as plain text. It does
  // not defeat a determined scraper, only the naive ones, which is most of them.
  const [user, domain] = email.split('@');
  const address = `${user}@${domain}`;

  return (
    <div className="contact-direct">
      <a className="button" href={`mailto:${address}`}>Email me</a>
      <code className="wrap-anywhere">{address}</code>
    </div>
  );
}

export default function Contact({ profile }) {
  const contact = profile.contact ?? { provider: 'none' };
  const email = profile.links?.email;

  if (contact.provider === 'none' && !email) return null;

  return (
    <Section id="contact" command="mail -s 'hello'">
      {contact.provider === 'formspree' && contact.formspreeId ? (
        <FormspreeForm formspreeId={contact.formspreeId} successMessage={contact.successMessage} />
      ) : (
        <DirectContact email={email} />
      )}
    </Section>
  );
}
