import { useState } from "react";
import { Link } from "react-router-dom";
import InviteCodeCard from "../components/InviteCodeCard";
import { useTrips } from "../context/tripsContext";
import { FLIGHT_LOOKUP } from "../data/mockTrips";
import { CURRENT_USER, DEFAULT_ALLOWANCES } from "../utils/constants";
import { formatDate, nowTime, todayISO } from "../utils/format";
import { generateInviteCode } from "../utils/inviteCode";

const FLIGHT_PATTERN = /^([A-Z0-9]{2})\s?(\d{1,4}[A-Z]?)$/;

function parseFlightNumber(raw) {
  const match = raw.trim().toUpperCase().match(FLIGHT_PATTERN);
  return match ? { airline: match[1], number: match[2] } : null;
}

function validate({ flightNumber, date }) {
  const errors = {};
  if (!flightNumber.trim()) {
    errors.flightNumber = "Enter the flight number, for example BA 65.";
  } else if (!parseFlightNumber(flightNumber)) {
    errors.flightNumber = "Flight number should be an airline code followed by digits, for example BA 65.";
  }
  if (!date) {
    errors.date = "Choose the date of the flight.";
  } else if (date < todayISO()) {
    errors.date = "The flight date cannot be in the past.";
  }
  return errors;
}

export default function CreateTrip() {
  const { addTrip } = useTrips();
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [inviteRole, setInviteRole] = useState("picker-upper");
  const [errors, setErrors] = useState({});
  const [created, setCreated] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const found = validate({ flightNumber, date });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { airline, number } = parseFlightNumber(flightNumber);
    const display = `${airline} ${number}`;
    const known = FLIGHT_LOOKUP[`${airline}${number}`];
    const trip = {
      id: `trip-${Date.now()}`,
      flightNumber: display,
      origin: known?.origin ?? { city: "", code: "" },
      destination: known?.destination ?? { city: "", code: "" },
      date,
      status: "not_departed",
      role: "traveller",
      departureTime: known?.departureTime ?? null,
      scheduledArrival: known?.scheduledArrival ?? null,
      estimatedArrival: known?.scheduledArrival ?? null,
      landedAt: null,
      estimatedAtGate: null,
      inviteCode: generateInviteCode(),
      traveller: { name: CURRENT_USER.name },
      allowances: DEFAULT_ALLOWANCES,
      imOut: false,
      imOutAt: null,
      people: [
        { name: CURRENT_USER.name, role: "traveller", status: "you" },
        { name: null, role: inviteRole, status: "pending" },
      ],
      updates: [{ time: nowTime(), title: "Trip created", text: `You created a trip for ${display}.` }],
    };
    addTrip(trip);
    setCreated(trip);
  }

  function startOver() {
    setCreated(null);
    setFlightNumber("");
    setDate("");
    setErrors({});
  }

  return (
    <main className="tl-page">
      <div className="tl-container">
        <header className="tl-page-header">
          <div>
            <h1 className="tl-h1">Create a trip</h1>
            <p className="tl-subtle">Link a flight so the people collecting you can follow it.</p>
          </div>
          <Link className="tl-btn tl-btn--outline" to="/linked-trips">
            Back to linked trips
          </Link>
        </header>

        <div className="tl-two-col">
          <form className="tl-card" onSubmit={handleSubmit} noValidate aria-labelledby="tl-create-title">
            <h2 id="tl-create-title" className="tl-card__title">
              Flight details
            </h2>

            <div className="tl-form-grid">
              <div className="tl-field">
                <label htmlFor="flight-number">Flight number</label>
                <input
                  id="flight-number"
                  type="text"
                  value={flightNumber}
                  placeholder="e.g. BA 65"
                  autoComplete="off"
                  disabled={Boolean(created)}
                  aria-invalid={errors.flightNumber ? "true" : undefined}
                  aria-describedby={errors.flightNumber ? "flight-number-error" : undefined}
                  onChange={(e) => setFlightNumber(e.target.value)}
                />
                {errors.flightNumber && (
                  <p id="flight-number-error" className="tl-error">
                    {errors.flightNumber}
                  </p>
                )}
              </div>
              <div className="tl-field">
                <label htmlFor="flight-date">Flight date</label>
                <input
                  id="flight-date"
                  type="date"
                  value={date}
                  min={todayISO()}
                  disabled={Boolean(created)}
                  aria-invalid={errors.date ? "true" : undefined}
                  aria-describedby={errors.date ? "flight-date-error" : undefined}
                  onChange={(e) => setDate(e.target.value)}
                />
                {errors.date && (
                  <p id="flight-date-error" className="tl-error">
                    {errors.date}
                  </p>
                )}
              </div>
            </div>

            <fieldset className="tl-fieldset" disabled={Boolean(created)}>
              <legend>Who are you inviting first?</legend>
              <div className="tl-toggle">
                {[
                  ["picker-upper", "Picker-upper"],
                  ["driver", "Driver"],
                ].map(([value, label]) => (
                  <label key={value} className={inviteRole === value ? "tl-toggle__option is-selected" : "tl-toggle__option"}>
                    <input
                      type="radio"
                      name="invite-role"
                      value={value}
                      checked={inviteRole === value}
                      onChange={() => setInviteRole(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="tl-note">
              Create the trip early, ideally the day before the flight or around departure, so Anga360 has more
              time to monitor changes and send useful pickup alerts.
            </p>

            <div className="tl-actions">
              <button type="submit" className="tl-btn tl-btn--primary" disabled={Boolean(created)}>
                Create trip
              </button>
              {created && (
                <button type="button" className="tl-btn tl-btn--ghost" onClick={startOver}>
                  Create another trip
                </button>
              )}
            </div>
          </form>

          <section className="tl-card" aria-labelledby="tl-code-title" aria-live="polite">
            {created ? (
              <>
                <span className="tl-pill tl-pill--success">Trip created</span>
                <h2 id="tl-code-title" className="tl-card__title tl-card__title--spaced">
                  Share your invite code
                </h2>
                <InviteCodeCard
                  large
                  code={created.inviteCode}
                  shareText={`Join my Anga360 trip for ${created.flightNumber} on ${formatDate(created.date)}. In Anga360, open Linked trips, choose Join with code and enter ${created.inviteCode}.`}
                />
                <p className="tl-card__text">
                  Share this code with a family member, friend or driver. They enter it under Linked trips, then
                  Join with code, to become linked to this trip.
                </p>
                <p className="tl-card__text">Only share the code with people you trust.</p>
                <Link className="tl-btn tl-btn--outline tl-btn--block" to={`/linked-trips/${created.id}`}>
                  View trip
                </Link>
              </>
            ) : (
              <>
                <h2 id="tl-code-title" className="tl-card__title">
                  Invite code
                </h2>
                <p className="tl-card__text">
                  Your invite code appears here once you create the trip. You can then share it with the people
                  collecting you.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}