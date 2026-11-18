import { useState } from "react";
import { AIRPORTS, distanceKm } from "../utils/airports";
import { ROLE_LABELS } from "../utils/constants";
import { clockOf, firstName } from "../utils/format";

const LANDED = ["landed", "at_gate"];

function howFar(km) {
  return km < 1 ? `${Math.max(10, Math.round(km * 100) * 10)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

// Once the flight has landed, everyone on the trip can share where they are, so they can find
// each other. Nothing is sent until you press a button. Two kinds:
//   flight   -> where the plane is (from OpenSky, or the arrival airport)
//   personal -> your own position, from this device's GPS
export default function LocationSharing({ trip, tracking, onShare, onStop, onMarkLanded }) {
  const [busy, setBusy] = useState(null); // "flight" | "personal" | "landed"
  const [message, setMessage] = useState({ text: "", error: false });

  const landed = LANDED.includes(trip.status);
  const shared = trip.shared ?? [];
  const mine = (kind) => shared.find((spot) => spot.mine && spot.kind === kind);
  const others = shared.filter((spot) => !spot.mine);
  const myPersonal = mine("personal");
  const isTraveller = trip.traveller?.id != null && trip.people.some((p) => p.status === "you" && p.role === "traveller");

  async function run(kind, work) {
    setBusy(kind);
    setMessage({ text: "", error: false });
    try {
      const result = await work();
      if (result && !result.ok) setMessage({ text: result.message, error: true });
    } catch (error) {
      setMessage({ text: error.message, error: true });
    } finally {
      setBusy(null);
    }
  }

  function shareFlight() {
    return run("flight", async () => {
      const plane = tracking.live || tracking.lastSeen;
      const airport = AIRPORTS[trip.destination?.code];

      if (plane) {
        return onShare("flight", {
          lat: plane.lat,
          lon: plane.lon,
          heading: plane.heading,
          altitude_ft: plane.altitudeFt,
          source: tracking.live ? "opensky" : "last-seen",
        });
      }
      if (airport) return onShare("flight", { lat: airport.lat, lon: airport.lon, source: "airport" });
      return { ok: false, message: "We can't tell where the flight is yet. Try again once it shows on the map." };
    });
  }

  function sharePersonal() {
    return run("personal", () => {
      if (!navigator.geolocation) {
        return Promise.resolve({ ok: false, message: "This browser can't share your location." });
      }
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve(
              onShare("personal", {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                accuracy_m: Math.round(position.coords.accuracy),
              }),
            ),
          (error) =>
            resolve({
              ok: false,
              message:
                error.code === 1
                  ? "Location permission was denied. Allow location for this site in your browser, then try again."
                  : "Couldn't get your location. Check that location is turned on and try again.",
            }),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      });
    });
  }

  const buttons = [
    ["flight", "Share flight location", "Update flight location", shareFlight],
    ["personal", "Share my location", "Update my location", sharePersonal],
  ];

  return (
    <section className="tl-card" aria-labelledby="tl-share-title">
      <h2 id="tl-share-title" className="tl-card__title">
        Find each other
      </h2>
      <p className="tl-card__text">
        {landed
          ? "Share where you are so the others on this trip can find you. Only people linked to this trip can see it, and nothing is shared until you choose."
          : "Location sharing opens once the flight has landed."}
      </p>

      <div className="tl-share">
        {buttons.map(([kind, label, updateLabel, handler]) => {
          const current = mine(kind);
          return (
            <div key={kind} className="tl-share__row">
              <button
                type="button"
                className={current ? "tl-btn tl-btn--outline" : "tl-btn tl-btn--primary"}
                onClick={handler}
                disabled={!landed || busy !== null}
              >
                {busy === kind ? "Sharing…" : current ? updateLabel : label}
              </button>
              {current && (
                <>
                  <span className="tl-pill tl-pill--success">Shared {clockOf(current.at)}</span>
                  <button
                    type="button"
                    className="tl-btn tl-btn--ghost"
                    onClick={() => run(kind, () => onStop(kind))}
                    disabled={busy !== null}
                  >
                    Stop sharing
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {!landed && isTraveller && (
        <p className="tl-hint">
          Already on the ground?{" "}
          <button
            type="button"
            className="tl-linkbutton"
            onClick={() => run("landed", onMarkLanded)}
            disabled={busy !== null}
          >
            Mark the flight as landed
          </button>
        </p>
      )}

      {message.text && (
        <p className={message.error ? "tl-error" : "tl-card__text"} role={message.error ? "alert" : "status"}>
          {message.text}
        </p>
      )}

      {others.length > 0 && (
        <ul className="tl-spots" aria-label="Locations shared with you">
          {others.map((spot) => {
            const person = trip.people.find((p) => p.user_id === spot.sender_id);
            const away = myPersonal ? distanceKm(myPersonal.lat, myPersonal.lon, spot.lat, spot.lon) : null;
            const sourceNote =
              spot.kind === "flight"
                ? spot.source === "airport"
                  ? "Arrival airport"
                  : spot.source === "last-seen"
                    ? "Where OpenSky last saw the plane"
                    : "Plane position"
                : spot.accuracy_m
                  ? `Accurate to about ${spot.accuracy_m} m`
                  : null;
            return (
              <li key={`${spot.sender_id}-${spot.kind}`} className="tl-spot">
                <div>
                  <p className="tl-person__name">
                    {firstName(spot.sender_name)}
                    {person ? ` · ${ROLE_LABELS[person.role]}` : ""}
                  </p>
                  <p className="tl-person__role">
                    {spot.kind === "flight" ? "Flight location" : "Personal location"} · shared {clockOf(spot.at)}
                    {away !== null ? ` · ${howFar(away)} from you` : ""}
                  </p>
                  {sourceNote && <p className="tl-person__role">{sourceNote}</p>}
                </div>
                <a
                  className="tl-btn tl-btn--outline"
                  href={`https://www.google.com/maps?q=${spot.lat},${spot.lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
