import { firstName } from "../utils/format";

export default function TravellerCard({ trip }) {
  const name = firstName(trip.traveller.name);
  return (
    <section className="tl-card" aria-labelledby="tl-traveller-title">
      <h2 id="tl-traveller-title" className="tl-card__title tl-card__title--small">
        Traveller
      </h2>
      <p className="tl-card__name">{trip.traveller.name}</p>
      <p>
        <span className={trip.imOut ? "tl-pill tl-pill--success" : "tl-pill tl-pill--neutral"}>
          {trip.imOut ? `Out at ${trip.imOutAt}` : "Not out yet"}
        </span>
      </p>
      <p className="tl-card__text">
        {trip.imOut
          ? `${name} has cleared immigration and baggage and is ready to be collected.`
          : `You will be notified when ${name} selects “I’m out” after clearing immigration and baggage.`}
      </p>
    </section>
  );
}