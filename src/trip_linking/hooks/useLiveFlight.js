import { useEffect, useState } from "react";
import { getAccessToken, getOpenSkyData } from "../../live_flight_info/opensky";
import { AIRPORTS, flightToCallsign } from "../utils/airports";

// Each check costs OpenSky credits, so we only check every 2 minutes.
const POLL_SECONDS = 120;

// The first search covers the route plus this many degrees of margin.
const ROUTE_MARGIN = 8;

// Once the plane is found we search only a small box around it (cheaper).
const NEAR_PLANE_BOX = 2;

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

// Looks for one flight on OpenSky and returns where the plane is.
// Only searches when "enabled" is true (the flight is departed or in the air).
// status: "idle" | "searching" | "found" | "not-found" | "error"
export function useLiveFlight(flightNumber, originCode, destinationCode, enabled) {
  const [live, setLive] = useState(null);
  const [status, setStatus] = useState("searching");

  const from = AIRPORTS[originCode];
  const to = AIRPORTS[destinationCode];
  const canSearch = Boolean(enabled && flightNumber && from && to);

  useEffect(() => {
    if (!canSearch) return;

    let stopped = false;
    let box = routeBox(from, to);
    const callsign = flightToCallsign(flightNumber);

    async function check() {
      try {
        const token = await getAccessToken();
        const data = await getOpenSkyData(token, box, "states");
        const rows = Array.isArray(data) ? data : data.states || [];

        // Each row is a list: [1] callsign, [5] longitude, [6] latitude,
        // [7] altitude in metres, [8] on ground, [9] speed in m/s, [10] heading.
        const row = rows.find((r) => (r[1] || "").trim() === callsign);

        if (stopped) return;

        if (!row || row[5] === null || row[6] === null) {
          setStatus("not-found");
          box = routeBox(from, to);
          return;
        }

        setLive({
          lat: row[6],
          lon: row[5],
          heading: row[10] || 0,
          onGround: row[8],
          altitudeFt: row[7] === null ? null : Math.round(row[7] * 3.281),
          speedKmh: row[9] === null ? null : Math.round(row[9] * 3.6),
          updatedAt: new Date(),
        });
        setStatus("found");
        box = boxAround(row[6], row[5]);
      } catch (error) {
        if (!stopped) setStatus("error");
      }
    }

    check();
    const timer = setInterval(check, POLL_SECONDS * 1000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [canSearch, flightNumber, from, to]);

  return canSearch ? { live, status } : { live: null, status: "idle" };
}