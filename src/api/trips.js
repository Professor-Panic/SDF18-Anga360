import { authFetch } from "./auth.js";

// Talks to the backend's trip routes. Always resolves to { ok: true, data } or
// { ok: false, message }, never throws.

async function call(path, method = "GET", body) {
  let res;
  try {
    res = await authFetch(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, message: "Can't reach the server. Is the backend running?" };
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    return { ok: false, message: "Your session has expired. Please log in again." };
  }
  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : null;
    return { ok: false, message: data.error || detail || `Request failed (${res.status})` };
  }
  return { ok: true, data };
}

// trip: { flight_number, flight_date, origin?, destination?, role }
// -> { code, expires_at, trip_id }. The code works for 15 minutes, once.
export function createInvite(trip) {
  return call("/api/invites", "POST", trip);
}

// -> { code, partner_id, role, trip_id }
export function redeemInvite(code) {
  return call("/api/invites/redeem", "POST", { invite_code: code });
}

// Every trip I'm on: people, invite state, landed/out, shared locations.
export function listTrips() {
  return call("/api/trips");
}

// payload: { type: "status", status: "landed" | "out" }
//       or { type: "location", kind: "flight" | "personal", lat, lon, ... }
export function sendPayload(tripId, payload) {
  return call(`/api/trips/${encodeURIComponent(tripId)}/payload`, "POST", payload);
}

// Traveller only: hide (or show again) the live plane for the picker-upper and driver.
export function setFlightHidden(tripId, hidden) {
  return sendPayload(tripId, { type: "flight_visibility", hidden });
}

export function stopSharingLocation(tripId, kind) {
  return call(`/api/trips/${encodeURIComponent(tripId)}/location/${kind}`, "DELETE");
}
