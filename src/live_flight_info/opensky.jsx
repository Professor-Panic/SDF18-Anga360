import { authFetch } from "../api/auth.js";

// Live aircraft data from the OpenSky Network, fetched through our own backend.
// The backend holds the OpenSky credentials and token, so nothing secret reaches the browser.
//
// type is one of: "states" | "flights" | "aircraft" | "arrival" | "departure" | "track"
//   states    live aircraft: { lamin, lomin, lamax, lomax, icao24, callsign, time }  (no box = whole world)
//             The backend asks adsb.lol first and falls back to OpenSky. Pass `callsign` (e.g. "KQA100")
//             to look one flight up directly; `time` (history) is answered by OpenSky only.
//   flights   all flights in a time window: { begin, end } (max 2 hours)
//   aircraft  flights of one aircraft: { icao24, begin, end }
//   arrival   arrivals at an airport: { airport, begin, end }   (airport = 4-letter ICAO code)
//   departure departures from an airport: { airport, begin, end }
//   track     trajectory of an aircraft: { icao24, time }
//
// "states" resolves to a list of { icao24, callsign, originCountry, longitude, latitude,
// altitude (m), onGround, velocity (m/s), heading, verticalRate }. Nothing matching resolves to [].
export async function getOpenSkyData(request = {}, type = "states") {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const qs = query.toString();

  let res;
  try {
    res = await authFetch(`/api/opensky/${type}${qs ? `?${qs}` : ""}`);
  } catch {
    throw new Error("Can't reach the server.");
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("Log in to see live flight data.");
  if (res.status === 429) throw new Error("Rate limit reached, try again later");
  if (!res.ok) throw new Error(data.error || `Live flight data failed (${res.status})`);
  return data;
}
