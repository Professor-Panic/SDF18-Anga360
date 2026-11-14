export default function UpdatesList({ updates }) {
  return (
    <section className="tl-card" aria-labelledby="tl-updates-title">
      <h2 id="tl-updates-title" className="tl-card__title">
        Updates
      </h2>
      {updates.length === 0 ? (
        <p className="tl-card__text">No updates yet. New flight updates will appear here.</p>
      ) : (
        <ul className="tl-updates">
          {updates.map((update, index) => (
            <li className="tl-update" key={`${update.time}-${update.title}-${index}`}>
              <span className="tl-update__time">{update.time}</span>
              <div>
                <p className="tl-update__title">{update.title}</p>
                <p className="tl-update__text">{update.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}