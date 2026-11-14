import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";
import { ROLE_LABELS } from "../utils/constants";
import { formatDate, routeLabel } from "../utils/format";

function timingText(trip) {
  if (trip.status === "not_departed" && trip.departureTime) {
    return `Departs ${trip.departureTime}`;
  }
  if (trip.estimatedArrival) return `Estimated arrival ${trip.estimatedArrival}`;
  return "Arrival time to be confirmed";
}

function peopleText(trip) {
  if (trip.role !== "traveller") return `Traveller: ${trip.traveller.name}`;
  const linked = trip.people
    .filter((p) => p.role !== "traveller" && p.status === "linked")
    .map((p) => p.name);
  return linked.length ? `Linked: ${linked.join(", ")}` : "Waiting for someone to join";
}

export default function TripCard({ trip }) {
  return (
    <li className="tl-trip-card">
      <span className="tl-badge" aria-hidden="true">
        {trip.flightNumber.slice(0, 2)}
      </span>
      <div className="tl-trip-card__main">
        <h3 className="tl-trip-card__route">
          {trip.flightNumber} · {routeLabel(trip)}
        </h3>
        <p className="tl-trip-card__meta">
          {formatDate(trip.date)} · {timingText(trip)}
        </p>
        <p className="tl-trip-card__meta">{peopleText(trip)}</p>
      </div>
      <div className="tl-trip-card__status">
        <StatusPill status={trip.status} />
        <span className="tl-trip-card__role">{ROLE_LABELS[trip.role]}</span>
      </div>
      <Link
        className="tl-btn tl-btn--outline"
        to={`/linked-trips/${trip.id}`}
        aria-label={`View trip ${trip.flightNumber}`}
      >
        View trip
      </Link>
    </li>
  );
}