import { Link, useParams, useSearchParams } from "react-router-dom";
import AccessCard from "../components/AccessCard";
import ArrivalCard from "../components/ArrivalCard";
import CollectionCard from "../components/CollectionCard";
import FlightMapPlaceholder from "../components/FlightMapPlaceholder";
import FlightProgress from "../components/FlightProgress";
import InviteCodeCard from "../components/InviteCodeCard";
import LeaveNowAlert from "../components/LeaveNowAlert";
import PeopleList from "../components/PeopleList";
import StatusPill from "../components/StatusPill";
import TravellerCard from "../components/TravellerCard";
import UpdatesList from "../components/UpdatesList";
import { useTrips } from "../context/tripsContext";
import { ROLE_LABELS, STATUS } from "../utils/constants";
import { formatDate, routeLabel } from "../utils/format";

const VALID_ROLES = ["traveller", "picker-upper", "driver"];

export default function TripDetails() {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const { trips, markOut } = useTrips();
  const trip = trips.find((item) => item.id === tripId);

  if (!trip) {
    return (
      <main className="tl-page">
        <div className="tl-container">
          <h1 className="tl-h1">Trip not found</h1>
          <p className="tl-subtle">
            This trip does not exist, or you are not linked to it.
          </p>
          <Link className="tl-btn tl-btn--primary" to="/linked-trips">
            Back to linked trips
          </Link>
        </div>
      </main>
    );
  }

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
                <FlightMapPlaceholder />
              </div>
              <div className="tl-stack">
                <PeopleList people={trip.people ?? []} />
                <section className="tl-card" aria-labelledby="tl-invite-title">
                  <h2
                    id="tl-invite-title"
                    className="tl-card__title tl-card__title--small"
                  >
                    Invite code
                  </h2>
                  <InviteCodeCard
                    code={trip.inviteCode}
                    shareText={`Join my Anga360 trip for ${trip.flightNumber} on ${formatDate(trip.date)}. In Anga360, open Linked trips, choose Join with code and enter ${trip.inviteCode}.`}
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
                <FlightMapPlaceholder />
              </div>
              <div className="tl-stack">
                <TravellerCard trip={trip} />
                <AccessCard role={role} />
              </div>
            </>
          )}

          {role === "driver" && (
            <>
              <div className="tl-stack">
                <ArrivalCard trip={trip} />
                <UpdatesList updates={trip.updates} />
                <FlightMapPlaceholder />
              </div>
              <div className="tl-stack">
                <TravellerCard trip={trip} />
                <AccessCard role={role} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
