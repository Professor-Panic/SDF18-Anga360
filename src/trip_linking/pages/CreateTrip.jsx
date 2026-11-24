import { useState } from "react";
import { Link } from "react-router-dom";
import InviteSection from "../components/InviteSection";
import { useTrips } from "../context/tripsContext";
import { FLIGHT_LOOKUP } from "../data/mockTrips";
import AirportPicker from "../components/AirportPicker";
import { formatDate, todayISO } from "../utils/format";

// Ticket number ("BA 65": 2-character airline code) or Airplane call sign.
const FLIGHT_PATTERN = /^([A-Z0-9]{2}|[A-Z]{3})\s?(\d{1,4}[A-Z]?)$/;

function parseFlightNumber(raw) {
  const match = raw.trim().toUpperCase().match(FLIGHT_PATTERN);
  return match ? { airline: match[1], number: match[2] } : null;
}

function validate({ flightNumber, date }) {
  const errors = {};
  if (!flightNumber.trim()) {
    errors.flightNumber = "Enter the flight number, for example BA 65.";
  } else if (!parseFlightNumber(flightNumber)) {
    errors.flightNumber = "Flight number should be an airline code followed by digits, for example BA 65 or BAW65.";
  }
  if (!date) {
    errors.date = "Choose the date of the flight.";
  } else if (date < todayISO()) {
    errors.date = "The flight date cannot be in the past.";
  }
  return errors;
}

export default function CreateTrip() {
  const { trips, createTrip, refreshInviteCode } = useTrips();
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [originCode, setOriginCode] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [inviteRole, setInviteRole] = useState("picker-upper");
  const [errors, setErrors] = useState({});
  const [createdId, setCreatedId] = useState(null);
  // Read from the live list, so the invite card updates when someone joins or the code runs out.
  const created = trips.find((trip) => trip.id === createdId) ?? null;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Known flights fill in their airports. Anything else: pick them, or skip and we track by flight number.
  function handleFlightNumber(value) {
    setFlightNumber(value);
    const parsed = parseFlightNumber(value);
    const known = parsed && FLIGHT_LOOKUP[`${parsed.airline}${parsed.number}`];
    if (known) {
      setOriginCode(known.origin.code);
      setDestinationCode(known.destination.code);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate({ flightNumber, date });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { airline, number } = parseFlightNumber(flightNumber);
    const trip = {
      flightNumber: `${airline} ${number}`,
      date,
      origin: { code: originCode },
      destination: { code: destinationCode },
    };

    setSubmitting(true);
    setSubmitError("");
    const result = await createTrip(trip, inviteRole);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setCreatedId(result.tripId);
  }

  function startOver() {
    setCreatedId(null);
    setFlightNumber("");
    setDate("");
    setOriginCode("");
    setDestinationCode("");
    setErrors({});
    setSubmitError("");
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
                  onChange={(e) => handleFlightNumber(e.target.value)}
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

            <div className="tl-form-grid">
              <AirportPicker
                id="origin-code"
                label="Departing from (optional)"
                value={originCode}
                disabled={Boolean(created)}
                onChange={setOriginCode}
              />
              <AirportPicker
                id="destination-code"
                label="Arriving at (optional)"
                value={destinationCode}
                disabled={Boolean(created)}
                onChange={setDestinationCode}
              />
            </div>
            <p className="tl-note">
              We find the plane on OpenSky using the flight number. Choosing the arrival airport also lets us
              tell when it has landed.
            </p>

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
              <button type="submit" className="tl-btn tl-btn--primary" disabled={Boolean(created) || submitting}>
                {submitting ? "Creating…" : "Create trip"}
              </button>
              {created && (
                <button type="button" className="tl-btn tl-btn--ghost" onClick={startOver}>
                  Create another trip
                </button>
              )}
            </div>
            {submitError && (
              <p className="tl-error" role="alert">
                {submitError}
              </p>
            )}
          </form>

          <section className="tl-card" aria-labelledby="tl-code-title" aria-live="polite">
            {created ? (
              <>
                <span className="tl-pill tl-pill--success">Trip created</span>
                <h2 id="tl-code-title" className="tl-card__title tl-card__title--spaced">
                  Share your invite code
                </h2>
                <InviteSection
                  large
                  trip={created}
                  onRefresh={refreshInviteCode}
                  shareText={(code) =>
                    `Join my Anga360 trip for ${created.flightNumber} on ${formatDate(created.date)}. In Anga360, open Linked trips, choose Join with code and enter ${code}.`
                  }
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