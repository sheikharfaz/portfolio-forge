export default function About({ profile }) {
  const text = profile.bio?.long;
  if (!text) return null;

  return (
    <section className="section container" id="about" aria-labelledby="about-title">
      <h2 className="section__title" id="about-title">About</h2>
      <div className="prose">
        {text.split(/\n{2,}/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
