export default function ArrivalCard({ trip }) {
  const rows = [
    ["Scheduled arrival", trip.scheduledArrival],
    ["Landed", trip.landedAt],
    ["Estimated at the gate", trip.estimatedAtGate],
  ];
  return (
    <section className="tl-card" aria-labelledby="tl-arrival-title">
      <h2 id="tl-arrival-title" className="tl-card__title">
        Arrival
      </h2>
      <dl className="tl-rows">
        {rows.map(([label, value]) => (
          <div className="tl-rows__row" key={label}>
            <dt>{label}</dt>
            <dd>{value ?? "Not available yet"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}