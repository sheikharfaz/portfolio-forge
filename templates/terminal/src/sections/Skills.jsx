import Section from './Section.jsx';

export default function Skills({ profile }) {
  const groups = profile.skills;
  if (!groups?.length) return null;

  return (
    <Section id="skills" command="ls skills/">
      <div className="skills">
        {groups.map((group) => (
          <div className="skills__group" key={group.group}>
            <h3 className="skills__group-name">{group.group}/</h3>
            <ul className="skills__items">
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
