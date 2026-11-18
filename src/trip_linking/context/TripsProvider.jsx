import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TripsContext } from "./tripsContext";
import { useAuth } from "../../auth/authContext.js";
import {
  createInvite,
  listTrips,
  redeemInvite,
  sendPayload,
  stopSharingLocation,
} from "../../api/trips.js";
import { normalizeInviteCode } from "../utils/inviteCode";
import { AIRPORTS } from "../utils/airports";
import { DEFAULT_ALLOWANCES, ROLE_LABELS } from "../utils/constants";
import { clockOf, firstName } from "../utils/format";

const NOT_LOGGED_IN = "Log in to create or join trips.";

// How often to ask the server what changed (someone joined, landed, shared a location...).
const REFRESH_SECONDS = 5;

const airport = (code) => ({ code: code ?? "", city: code ? AIRPORTS[code]?.city ?? code : "" });

// What the live OpenSky tracking says, until the flight is confirmed landed.
const PHASE_TO_STATUS = { in_air: "in_air", landed: "landed", not_departed: "not_departed" };

// Server trip -> the shape the pages and cards already use.
function toTrip(server, phase) {
  const status = server.landed_at
    ? "landed"
    : PHASE_TO_STATUS[phase] ?? "unknown";

  const updates = [];
  for (const person of server.people) {
    if (person.joined_at) {
      const who = person.status === "you" ? "You" : firstName(person.name);
      updates.push({
        ts: person.joined_at,
        title: "Linked",
        text: `${who} joined as ${ROLE_LABELS[person.role]}.`,
      });
    }
  }
  if (server.landed_at) {
    updates.push({ ts: server.landed_at, title: "Landed", text: `${server.flight_number} has landed.` });
  }
  if (server.out_at) {
    updates.push({
      ts: server.out_at,
      title: "I'm out",
      text: `${firstName(server.traveller.name)} has cleared immigration and baggage.`,
    });
  }
  for (const spot of server.shared) {
    const who = spot.mine ? "You" : firstName(spot.sender_name);
    updates.push({
      ts: spot.at,
      title: spot.kind === "flight" ? "Flight location shared" : "Location shared",
      text: `${who} shared ${spot.kind === "flight" ? "the flight's" : "a personal"} location.`,
    });
  }
  updates.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  return {
    id: server.id,
    flightNumber: server.flight_number,
    origin: airport(server.origin),
    destination: airport(server.destination),
    date: server.date,
    status,
    role: server.role,
    departureTime: null,
    scheduledArrival: null,
    estimatedArrival: null,
    landedAt: clockOf(server.landed_at),
    landedAtIso: server.landed_at,
    estimatedAtGate: null,
    invite: server.invite,
    inviteCode: server.invite?.code ?? null,
    inviteExpiresAt: server.invite?.expires_at ?? null,
    traveller: server.traveller,
    allowances: DEFAULT_ALLOWANCES,
    imOut: Boolean(server.out_at),
    imOutAt: clockOf(server.out_at),
    people: server.people,
    flightHidden: Boolean(server.flight_hidden),
    shared: server.shared,
    updates: updates.map((u) => ({ time: clockOf(u.ts), title: u.title, text: u.text })),
  };
}

// Wrapper: start fresh whenever a different user logs in.
export default function TripsProvider({ children }) {
  const { user } = useAuth();
  return (
    <TripsStore key={user?.id ?? "anonymous"} user={user}>
      {children}
    </TripsStore>
  );
}

function TripsStore({ user, children }) {
  const userId = user?.id ?? null;
  const [serverTrips, setServerTrips] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [phases, setPhases] = useState({}); // tripId -> live OpenSky phase (this session only)
  const lastJson = useRef("");

  // Ask the server for my trips. Only updates the screen if something changed.
  const refresh = useCallback(async () => {
    if (!userId) return;
    const result = await listTrips();
    if (result.ok) {
      const json = JSON.stringify(result.data);
      if (json !== lastJson.current) {
        lastJson.current = json;
        setServerTrips(result.data);
      }
    }
    setLoading(false);
  }, [userId]);

  // Load once, then keep checking while the tab is visible. This is what turns
  // "Invite pending" into "Linked" on the traveller's screen after someone joins.
  useEffect(() => {
    if (!userId) return;
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, REFRESH_SECONDS * 1000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, refresh]);

  const trips = useMemo(
    () => serverTrips.map((trip) => toTrip(trip, phases[trip.id])),
    [serverTrips, phases],
  );

  const reportPhase = useCallback((tripId, phase) => {
    setPhases((previous) => (previous[tripId] === phase ? previous : { ...previous, [tripId]: phase }));
  }, []);

  // Traveller: ask the backend for an invite code for this flight.
  // `trip` has the flight details: { flightNumber, date, origin: {code}, destination: {code} }
  const createTrip = useCallback(
    async (trip, inviteRole) => {
      if (!user) return { ok: false, message: NOT_LOGGED_IN };

      const invite = await createInvite({
        flight_number: trip.flightNumber,
        flight_date: trip.date,
        origin: trip.origin?.code || null,
        destination: trip.destination?.code || null,
        role: inviteRole,
      });
      if (!invite.ok) return invite;

      await refresh();
      return { ok: true, tripId: invite.data.trip_id };
    },
    [user, refresh],
  );

  // Codes only work once, for 15 minutes. This gets a fresh one for a trip.
  const refreshInviteCode = useCallback(
    async (tripId, role) => {
      const trip = trips.find((item) => item.id === tripId);
      if (!trip) return { ok: false, message: "Trip not found." };

      const invite = await createInvite({
        flight_number: trip.flightNumber,
        flight_date: trip.date,
        origin: trip.origin.code || null,
        destination: trip.destination.code || null,
        role: role ?? trip.invite?.role ?? "picker-upper",
      });
      if (!invite.ok) return invite;

      await refresh();
      return { ok: true };
    },
    [trips, refresh],
  );

  // Picker-upper or driver: redeem a code the traveller shared.
  // The role comes from the invite (the traveller chose it when making the code).
  const joinTripByCode = useCallback(
    async (rawCode) => {
      if (!user) return { ok: false, message: NOT_LOGGED_IN };

      const code = normalizeInviteCode(rawCode);
      if (!code) {
        return { ok: false, message: "Enter the 8-character invite code, for example K7F3-QX2M." };
      }

      const result = await redeemInvite(code);
      if (!result.ok) return result;

      await refresh();
      return { ok: true, tripId: result.data.trip_id, role: result.data.role };
    },
    [user, refresh],
  );

  // Say something to everyone on the trip, then re-read the trip.
  const send = useCallback(
    async (tripId, payload) => {
      const result = await sendPayload(tripId, payload);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  // Traveller: hide the live plane from the picker-upper and driver (or show it again).
  const setFlightHidden = useCallback(
    (tripId, hidden) => send(tripId, { type: "flight_visibility", hidden }),
    [send],
  );

  const markOut = useCallback((tripId) => send(tripId, { type: "status", status: "out" }), [send]);
  const reportLanded = useCallback((tripId) => send(tripId, { type: "status", status: "landed" }), [send]);

  // kind: "flight" | "personal". fields: { lat, lon, accuracy_m?, heading?, altitude_ft?, source? }
  const shareLocation = useCallback(
    (tripId, kind, fields) => send(tripId, { type: "location", kind, ...fields }),
    [send],
  );

  const stopSharing = useCallback(
    async (tripId, kind) => {
      const result = await stopSharingLocation(tripId, kind);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      trips, loading, refreshInviteCode, createTrip, joinTripByCode,
      markOut, reportLanded, reportPhase, shareLocation, stopSharing, setFlightHidden,
    }),
    [trips, loading, refreshInviteCode, createTrip, joinTripByCode,
     markOut, reportLanded, reportPhase, shareLocation, stopSharing, setFlightHidden],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}
