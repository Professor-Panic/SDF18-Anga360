import { STATUS } from "../utils/constants";

// Traveller only: "I’m out" tells the people collecting them to come to arrivals.
export default function CollectionCard({ trip, onImOut }) {
  const hasLanded = STATUS[trip.status].stage >= 3;

  if (trip.imOut) {
    return (
      <section className="tl-card tl-card--success" aria-labelledby="tl-collect-title">
        <h2 id="tl-collect-title" className="tl-card__title">
          You are out
        </h2>
        <p className="tl-card__text" role="status">
          You marked yourself as out at {trip.imOutAt}. The people collecting you can see this update.
        </p>
      </section>
    );
  }

  return (
    <section className="tl-card tl-card--accent" aria-labelledby="tl-collect-title">
      <h2 id="tl-collect-title" className="tl-card__title">
        Ready to be collected?
      </h2>
      <p className="tl-card__text">
        Select “I’m out” once you have cleared immigration and baggage. The people collecting you
        will be notified.
      </p>
      <button
        type="button"
        className="tl-btn tl-btn--primary tl-btn--block"
        onClick={onImOut}
        disabled={!hasLanded}
        aria-describedby={hasLanded ? undefined : "tl-collect-hint"}
      >
        I’m out
      </button>
      {!hasLanded && (
        <p id="tl-collect-hint" className="tl-hint">
          This button is available once your flight has landed.
        </p>
      )}
    </section>
  );
}