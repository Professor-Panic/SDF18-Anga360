const ACCESS_TEXT = {
  "picker-upper":
    "As a picker-upper you can follow flight progress and receive pickup and Leave now updates. Only the traveller can create the trip or invite people.",
  driver:
    "As a driver you can see the arrival details and pickup updates you need for collection. Only the traveller can create the trip or invite people.",
};

export default function AccessCard({ role }) {
  return (
    <section className="tl-card" aria-labelledby="tl-access-title">
      <h2 id="tl-access-title" className="tl-card__title tl-card__title--small">
        Your access
      </h2>
      <p className="tl-card__text">{ACCESS_TEXT[role]}</p>
    </section>
  );
}