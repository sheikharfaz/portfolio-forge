export default function Skills({ profile }) {
  const groups = profile.skills;
  if (!groups?.length) return null;

  return (
    <section className="section container" id="skills" aria-labelledby="skills-title">
      <h2 className="section__title" id="skills-title">Skills</h2>
      <div className="skills">
        {groups.map((group) => (
          <div key={group.group}>
            <h3 className="skills__group-name">{group.group}</h3>
            <ul className="tags">
              {group.items.map((item) => (
                <li className="tag" key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
