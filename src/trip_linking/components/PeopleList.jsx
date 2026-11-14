import { ROLE_LABELS } from "../utils/constants";

const PARTICIPANT_ROLES = ["traveller", "driver", "picker-upper"];

const STATUS_STYLES = {
  you: { label: "You", tone: "info" },
  linked: { label: "Linked", tone: "success" },
  pending: { label: "Invite pending", tone: "warning" },
  available: { label: "Available", tone: "neutral" },
};

export default function PeopleList({ people = [] }) {
  const participants = PARTICIPANT_ROLES.map((role) => {
    const person = people.find((item) => item.role === role);

    if (person) {
      return { ...person, role };
    }

    return {
      name: null,
      role,
      status: "available",
    };
  });

  return (
    <section className="tl-card" aria-labelledby="tl-people-title">
      <h2 id="tl-people-title" className="tl-card__title">
        People on this trip
      </h2>

      <ul className="tl-people">
        {participants.map((person) => {
          const name = person.name?.trim() || "Not joined yet";
          const status = STATUS_STYLES[person.status] ?? STATUS_STYLES.available;
          const roleLabel = ROLE_LABELS[person.role] ?? person.role;

          return (
            <li className="tl-person" key={person.role}>
              <span className="tl-person__avatar" aria-hidden="true">
                {person.name?.trim()?.[0]?.toUpperCase() ?? "?"}
              </span>

              <div className="tl-person__text">
                <p className="tl-person__name">{name}</p>
                <p className="tl-person__role">{roleLabel}</p>
              </div>

              <span className={`tl-pill tl-pill--${status.tone}`}>
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
