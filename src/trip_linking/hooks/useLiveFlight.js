import { useEffect, useRef, useState } from "react";
import { getOpenSkyData } from "../../live_flight_info/opensky";
import { AIRPORTS, distanceKm, flightToCallsign } from "../utils/airports";

// Each check costs OpenSky credits, so we only check every 2 minutes.
const POLL_SECONDS = 120;

// If the route is known, the first search covers it plus this many degrees of margin.
// If it isn't, the first search covers the whole world (a few credits), after which
// we only search a small box around the plane (1 credit).
const ROUTE_MARGIN = 8;
const NEAR_PLANE_BOX = 2;

// "Landed" when the plane disappears (transponder off) below this height, near its destination.
const LANDING_MAX_FT = 13000;
const LANDING_MAX_KM = 200;
const ON_GROUND_NEAR_KM = 30;

function routeBox(from, to) {
  return {
    lamin: Math.min(from.lat, to.lat) - ROUTE_MARGIN,
    lamax: Math.max(from.lat, to.lat) + ROUTE_MARGIN,
    lomin: Math.min(from.lon, to.lon) - ROUTE_MARGIN,
    lomax: Math.max(from.lon, to.lon) + ROUTE_MARGIN,
  };
}

function boxAround(lat, lon) {
  return {
    lamin: lat - NEAR_PLANE_BOX,
    lamax: lat + NEAR_PLANE_BOX,
    lomin: lon - NEAR_PLANE_BOX,
    lomax: lon + NEAR_PLANE_BOX,
  };
}

// ---- last sighting, kept per trip so a reload (or the plane vanishing) doesn't lose it ----

const seenKey = (tripId) => `anga_seen_${tripId}`;

function loadSeen(tripId) {
  try {
    const seen = JSON.parse(localStorage.getItem(seenKey(tripId)));
    return seen ? { ...seen, updatedAt: new Date(seen.updatedAt) } : null;
  } catch {
    return null;
  }
}

function saveSeen(tripId, seen) {
  try {
    localStorage.setItem(seenKey(tripId), JSON.stringify(seen));
  } catch {
    /* storage blocked: we just won't remember it */
  }
}

// Where is this flight in its journey?
//   "in_air" | "landed" | "not_departed" | "unknown" (not visible, and we can't tell why)
function decidePhase(sample, seen, to) {
  if (sample) {
    if (!sample.onGround) return "in_air";
    const nearDestination = to && distanceKm(sample.lat, sample.lon, to.lat, to.lon) < ON_GROUND_NEAR_KM;
    return seen?.wasAirborne || nearDestination ? "landed" : "not_departed";
  }
  // Planes drop off OpenSky once they land and switch off, so "it was flying, now it's gone
  // low down near where it was going" counts as landed.
  if (seen?.wasAirborne && to) {
    const low = seen.altitudeFt === null || seen.altitudeFt < LANDING_MAX_FT;
    if (low && distanceKm(seen.lat, seen.lon, to.lat, to.lon) < LANDING_MAX_KM) return "landed";
  }
  return "unknown";
}

// Looks for one flight on OpenSky by its flight number (callsign) and returns where the plane is.
// Only searches while `enabled` is true (flight day, not landed yet).
// status: "idle" | "searching" | "found" | "not-found" | "error"
export function useLiveFlight({ tripId, flightNumber, originCode, destinationCode, enabled }) {
  const from = AIRPORTS[originCode];
  const to = AIRPORTS[destinationCode];
  const canSearch = Boolean(enabled && tripId && flightNumber);

  const [live, setLive] = useState(null);
  const [seen, setSeen] = useState(() => loadSeen(tripId));
  const [status, setStatus] = useState("searching");
  const [phase, setPhase] = useState(() => decidePhase(null, loadSeen(tripId), to));
  const seenRef = useRef(seen);

  useEffect(() => {
    if (!canSearch) return;

    let stopped = false;
    const callsign = flightToCallsign(flightNumber);
    const wholeRoute = () => (from && to ? routeBox(from, to) : {}); // {} = the whole world
    let box = wholeRoute();

    async function check() {
      try {
        const planes = await getOpenSkyData(box, "states");
        if (stopped) return;

        // If two aircraft share a callsign, prefer the one that is flying.
        const matches = planes.filter(
          (p) => p.callsign === callsign && p.latitude !== null && p.longitude !== null
        );
        const plane = matches.find((p) => !p.onGround) || matches[0];

        if (!plane) {
          setLive(null);
          setStatus("not-found");
          setPhase(decidePhase(null, seenRef.current, to));
          box = wholeRoute();
          return;
        }

        const sample = {
          lat: plane.latitude,
          lon: plane.longitude,
          heading: plane.heading || 0,
          onGround: plane.onGround,
          altitudeFt: plane.altitude === null ? null : Math.round(plane.altitude * 3.281),
          speedKmh: plane.velocity === null ? null : Math.round(plane.velocity * 3.6),
          updatedAt: new Date(),
        };
        const nextSeen = {
          ...sample,
          wasAirborne: Boolean(seenRef.current?.wasAirborne || !sample.onGround),
        };
        seenRef.current = nextSeen;
        saveSeen(tripId, nextSeen);

        setLive(sample);
        setSeen(nextSeen);
        setStatus("found");
        setPhase(decidePhase(sample, nextSeen, to));
        box = boxAround(plane.latitude, plane.longitude);
      } catch {
        if (!stopped) setStatus("error");
      }
    }

    check();
    const timer = setInterval(check, POLL_SECONDS * 1000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [canSearch, tripId, flightNumber, from, to]);

  return canSearch
    ? { live, lastSeen: seen, status, phase }
    : { live: null, lastSeen: seen, status: "idle", phase: decidePhase(null, seen, to) };
}
