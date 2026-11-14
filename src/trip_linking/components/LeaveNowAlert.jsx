import { STATUS, DEFAULT_ALLOWANCES } from "../utils/constants";
import { firstName } from "../utils/format";
import { calculateLeaveBy } from "../utils/leaveNow";

// Picker-upper only: when to leave home, from the estimated arrival time.
export default function LeaveNowAlert({ trip }) {
  const name = firstName(trip.traveller?.name ?? "Traveller");
  const status = STATUS[trip.status] ?? STATUS.not_departed;
  const allowances = trip.allowances ?? DEFAULT_ALLOWANCES;
  const { traffic, parking, walk } = allowances;

  if (status.stage >= 3) {
    return (
      <section className="tl-alert tl-alert--landed" aria-labelledby="tl-alert-title">
        <h2 id="tl-alert-title" className="tl-alert__headline">
          {name} has landed
        </h2>
        <p className="tl-alert__text">
          {trip.imOut
            ? `${name} is out and ready to be collected.`
            : `You will be notified when ${name} selects “I’m out”.`}
        </p>
      </section>
    );
  }

  const leaveBy = calculateLeaveBy(trip.estimatedArrival, allowances);

  return (
    <section className="tl-alert" aria-labelledby="tl-alert-title">
      <span className="tl-alert__tag">Leave now alert</span>

      <h2 id="tl-alert-title" className="tl-alert__headline">
        {leaveBy ? `Leave by ${leaveBy}` : "Arrival time unavailable"}
      </h2>

      <p className="tl-alert__text">
        {leaveBy
          ? `${name} is expected to land at ${trip.estimatedArrival}. This allows for traffic, parking and the walk to the arrivals area.`
          : `We don't have an estimated arrival time for ${name}'s flight yet. Check again when flight information becomes available.`}
      </p>

      <ul className="tl-chips">
        <li className="tl-chip">Traffic {traffic} min</li>
        <li className="tl-chip">Parking {parking} min</li>
        <li className="tl-chip">Walk to arrivals {walk} min</li>
      </ul>
    </section>
  );
}
