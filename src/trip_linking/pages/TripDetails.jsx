import { useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import AccessCard from "../components/AccessCard";
import ArrivalCard from "../components/ArrivalCard";
import CollectionCard from "../components/CollectionCard";
import FlightMap from "../components/FlightMap";
import FlightProgress from "../components/FlightProgress";
import InviteSection from "../components/InviteSection";
import LeaveNowAlert from "../components/LeaveNowAlert";
import LocationSharing from "../components/LocationSharing";
import PeopleList from "../components/PeopleList";
import StatusPill from "../components/StatusPill";
import TravellerCard from "../components/TravellerCard";
import UpdatesList from "../components/UpdatesList";
import { useLiveFlight } from "../hooks/useLiveFlight";
import { useTrips } from "../context/tripsContext";
import { ROLE_LABELS, STATUS } from "../utils/constants";
import { formatDate, routeLabel } from "../utils/format";

const VALID_ROLES = ["traveller", "picker-upper", "driver"];

// Track the flight from the day before it leaves until the day after it lands.
function inTrackingWindow(dateISO) {
  if (!dateISO) return false;
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(`${dateISO}T00:00:00`).getTime();
  const now = Date.now();
  return now >= start - day && now < start + 2 * day;
}

export default function TripDetails() {
  const { tripId } = useParams();
  const { trips, loading } = useTrips();
  const trip = trips.find((item) => item.id === tripId);

  if (!trip) {
    return (
      <main className="tl-page">
        <div className="tl-container">
          <h1 className="tl-h1">{loading ? "Loading trip…" : "Trip not found"}</h1>
          {!loading && (
            <>
              <p className="tl-subtle">This trip does not exist, or you are not linked to it.</p>
              <Link className="tl-btn tl-btn--primary" to="/linked-trips">
                Back to linked trips
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  // keyed, so switching trips starts the map and tracking fresh
  return <TripView key={trip.id} trip={trip} />;
}

function TripView({ trip }) {
  const [searchParams] = useSearchParams();
  const { markOut, refreshInviteCode, reportLanded, reportPhase, shareLocation, stopSharing, setFlightHidden } = useTrips();

  // The traveller can hide the live plane from the picker-upper and driver until landing.
  const flightHiddenFromMe = trip.flightHidden && trip.role !== "traveller";

  // Find the plane on OpenSky from the flight number. Stops once the flight is confirmed landed.
  const tracking = useLiveFlight({
    tripId: trip.id,
    flightNumber: trip.flightNumber,
    originCode: trip.origin.code,
    destinationCode: trip.destination.code,
    enabled: !trip.landedAtIso && inTrackingWindow(trip.date) && !flightHiddenFromMe,
  });

  // Tell the trip list what we see, and tell everyone on the trip once it has landed.
  useEffect(() => {
    reportPhase(trip.id, tracking.phase);
  }, [trip.id, tracking.phase, reportPhase]);

  const reportedLanded = useRef(false);
  useEffect(() => {
    if (tracking.phase !== "landed" || trip.landedAtIso || reportedLanded.current) return;
    reportedLanded.current = true;
    reportLanded(trip.id).then((result) => {
      if (!result.ok) reportedLanded.current = false; // try again on the next check
    });
  }, [tracking.phase, trip.id, trip.landedAtIso, reportLanded]);

  const requestedRole = searchParams.get("as");
  const role = VALID_ROLES.includes(requestedRole)
    ? requestedRole
    : trip.role;

  return (
    <main className="tl-page">
      <div className="tl-container">
        <Link className="tl-backlink" to="/linked-trips">
          ← Back to linked trips
        </Link>

        <header className="tl-trip-header">
          <div>
            <h1 className="tl-h1">
              {trip.flightNumber} · {routeLabel(trip)}
            </h1>
            <p className="tl-subtle">
              {formatDate(trip.date)} · Your role: {ROLE_LABELS[role]}
            </p>
          </div>
          <StatusPill status={trip.status} />
        </header>

        {role !== trip.role && (
          <p className="tl-card__text">
            Demonstration view: you are viewing this trip as a {ROLE_LABELS[role].toLowerCase()}.
            {" "}
            <Link to={`/linked-trips/${trip.id}`}>
              Switch back to the traveller's view
            </Link>
          </p>
        )}

        {role === trip.role && trip.role === "traveller" && (
          <p className="tl-card__text">
            <Link to={`/linked-trips/${trip.id}?as=picker-upper`}>
              Preview picker-upper view
            </Link>
            {" · "}
            <Link to={`/linked-trips/${trip.id}?as=driver`}>
              Preview driver view
            </Link>
          </p>
        )}

        <FlightProgress stage={STATUS[trip.status].stage} />

        <div className="tl-two-col tl-two-col--details">
          {role === "traveller" && (
            <>
              <div className="tl-stack">
                <ArrivalCard trip={trip} />
                <CollectionCard
                  trip={trip}
                  onImOut={() => markOut(trip.id)}
                />
                <FlightMap
                  key={trip.id}
                  trip={trip}
                  tracking={tracking}
                  onSetFlightHidden={(hidden) => setFlightHidden(trip.id, hidden)}
                />
              </div>
              <div className="tl-stack">
                <PeopleList people={trip.people ?? []} />
                <LocationSharing
                  trip={trip}
                  tracking={tracking}
                  onShare={(kind, fields) => shareLocation(trip.id, kind, fields)}
                  onStop={(kind) => stopSharing(trip.id, kind)}
                  onMarkLanded={() => reportLanded(trip.id)}
                />

                <section className="tl-card" aria-labelledby="tl-invite-title">
                  <h2
                    id="tl-invite-title"
                    className="tl-card__title tl-card__title--small"
                  >
                    Invite code
                  </h2>
                  <InviteSection
                    trip={trip}
                    onRefresh={refreshInviteCode}
                    shareText={(code) =>
                      `Join my Anga360 trip for ${trip.flightNumber} on ${formatDate(trip.date)}. In Anga360, open Linked trips, choose Join with code and enter ${code}.`
                    }
                  />
                </section>
              </div>
            </>
          )}

          {role === "picker-upper" && (
            <>
              <div className="tl-stack">
                <LeaveNowAlert trip={trip} />
                <UpdatesList updates={trip.updates} />
                <FlightMap
                  key={trip.id}
                  trip={trip}
                  tracking={tracking}
                  onSetFlightHidden={(hidden) => setFlightHidden(trip.id, hidden)}
                />
              </div>
              <div className="tl-stack">
                <TravellerCard trip={trip} />
                <LocationSharing
                  trip={trip}
                  tracking={tracking}
                  onShare={(kind, fields) => shareLocation(trip.id, kind, fields)}
                  onStop={(kind) => stopSharing(trip.id, kind)}
                  onMarkLanded={() => reportLanded(trip.id)}
                />
                <AccessCard role={role} />
              </div>
            </>
          )}

          {role === "driver" && (
            <>
              <div className="tl-stack">
                <ArrivalCard trip={trip} />
                <UpdatesList updates={trip.updates} />
                <FlightMap
                  key={trip.id}
                  trip={trip}
                  tracking={tracking}
                  onSetFlightHidden={(hidden) => setFlightHidden(trip.id, hidden)}
                />
              </div>
              <div className="tl-stack">
                <TravellerCard trip={trip} />
                <LocationSharing
                  trip={trip}
                  tracking={tracking}
                  onShare={(kind, fields) => shareLocation(trip.id, kind, fields)}
                  onStop={(kind) => stopSharing(trip.id, kind)}
                  onMarkLanded={() => reportLanded(trip.id)}
                />
                <AccessCard role={role} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}