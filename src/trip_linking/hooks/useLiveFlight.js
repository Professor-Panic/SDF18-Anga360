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
        const planes = await getOpenSkyData(token, box, "states");
        const plane = planes.find((p) => p.callsign === callsign);

        if (stopped) return;

        if (!plane || plane.latitude === null || plane.longitude === null) {
          setStatus("not-found");
          box = routeBox(from, to);
          return;
        }

        setLive({
          lat: plane.latitude,
          lon: plane.longitude,
          heading: plane.heading || 0,
          onGround: plane.onGround,
          altitudeFt: plane.altitude === null ? null : Math.round(plane.altitude * 3.281),
          speedKmh: plane.velocity === null ? null : Math.round(plane.velocity * 3.6),
          updatedAt: new Date(),
        });
        setStatus("found");
        box = boxAround(plane.latitude, plane.longitude);
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