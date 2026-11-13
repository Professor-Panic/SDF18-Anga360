import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TripCard from "../components/TripCard";
import { useTrips } from "../context/tripsContext";

export default function LinkedTrips() {
  const { trips, joinTripByCode } = useTrips();
  const navigate = useNavigate();
  const codeInput = useRef(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("picker-upper");
  const [error, setError] = useState("");

  function handleJoin(event) {
    event.preventDefault();

    const result = joinTripByCode(code, { name, role });

    if (result.ok) {
      navigate(`/linked-trips/${result.tripId}?as=${result.role}`);
      return;
    }

    setError(result.message);
  }

  return (
    <main className="tl-page">
      <div className="tl-container">
        <header className="tl-page-header">
          <div>
            <h1 className="tl-h1">Linked trips</h1>
            <p className="tl-subtle">
              Flights you are connected to, with their current status and your role.
            </p>
          </div>
          <div className="tl-actions">
            <button
              type="button"
              className="tl-btn tl-btn--outline"
              onClick={() => codeInput.current?.focus()}
            >
              Join with code
            </button>
            <Link className="tl-btn tl-btn--primary" to="/linked-trips/new">
              Create a trip
            </Link>
          </div>
        </header>

        <section className="tl-card tl-join" aria-labelledby="tl-join-title">
          <div>
            <h2 id="tl-join-title" className="tl-card__title tl-card__title--small">
              Have an invite code?
            </h2>
            <p className="tl-card__text">
              Enter the code a traveller shared with you to join their trip.
            </p>
          </div>

          <form className="tl-join__form" onSubmit={handleJoin} noValidate>
            <div className="tl-field">
              <label htmlFor="invite-code">Invite code</label>
              <input
                id="invite-code"
                ref={codeInput}
                type="text"
                value={code}
                placeholder="e.g. K7F-3QX"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={10}
                aria-invalid={error ? "true" : undefined}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="tl-field">
              <label htmlFor="participant-name">Your name</label>
              <input
                id="participant-name"
                type="text"
                value={name}
                placeholder="Enter your name"
                autoComplete="name"
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
              />
            </div>

            <div className="tl-field">
              <label htmlFor="participant-role">Joining as</label>
              <select
                id="participant-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="picker-upper">Picker-upper</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            <button type="submit" className="tl-btn tl-btn--primary">
              Join trip
            </button>
          </form>

          {error && (
            <p className="tl-error tl-join__error" role="alert">
              {error}
            </p>
          )}
        </section>

        <h2 className="tl-h2">Your trips ({trips.length})</h2>

        {trips.length === 0 ? (
          <p className="tl-empty">
            You are not linked to any trips yet. Create a trip, or join one with an invite code.
          </p>
        ) : (
          <ul className="tl-trip-list">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
