import Section from './Section.jsx';

export default function About({ profile }) {
  const text = profile.bio?.long;
  if (!text) return null;

  return (
    <Section id="about" command="cat about.md">
      <div className="prose">
        {text.split(/\n{2,}/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      </div>
    </Section>
  );
}
