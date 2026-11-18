import { authFetch } from "./auth.js";
import { savedToFlight } from "./flights.js";

// Saved flights live in the backend (see /api/saved-flights), in the flights and
// flight_segments tables. A round trip is one flight whose segments are the outbound legs
// followed by the return legs.
// Every call resolves to { ok: true, data } or { ok: false, message } and never throws.

async function call(path, options) {
  let res;
  try {
    res = await authFetch(path, options);
  } catch {
    return { ok: false, message: "Can't reach the server. Is the backend running?" };
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { ok: false, message: "Your session has expired. Please log in again." };
  if (!res.ok) return { ok: false, message: data.error || `Request failed (${res.status})` };
  return { ok: true, data };
}

export async function listSavedFlights() {
  const result = await call("/api/saved-flights");
  return result.ok ? { ok: true, data: result.data.map(savedToFlight) } : result;
}

export function saveFlight(flight) {
  const stamp = (s) => s ?? null;
  const legs = [...flight.segments, ...(flight.inbound ? flight.inbound.segments : [])];
  return call("/api/saved-flights", {
    method: "POST",
    body: JSON.stringify({
      origin: flight.depCode,
      destination: flight.arrCode,
      departure: stamp(flight.depStamp),
      arrival: stamp(flight.arrStamp),
      price: Math.round(flight.price),
      currency: flight.currency,
      segments: legs.map((s) => ({
        origin: s.depCode,
        destination: s.arrCode,
        origin_name: s.depAirport ?? null,
        destination_name: s.arrAirport ?? null,
        departure: stamp(s.depStamp),
        arrival: stamp(s.arrStamp),
        airline: s.airline ?? null,
        flight_number: s.flightNumber ?? null,
        aircraft: s.aircraft ?? null,
      })),
    }),
  });
}

export const unsaveFlight = (flightId) =>
  call(`/api/saved-flights/${encodeURIComponent(flightId)}`, { method: "DELETE" });
