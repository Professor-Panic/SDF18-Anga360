
import { API_URL } from "./config.js";
import { getRates, toKes } from "../utils/currency.js";
import { airlineCode } from "./airlines.js";

const cache = new Map();

export function searchFlights(query) {
  const key = JSON.stringify(query);
  if (!cache.has(key)) {
    const promise = request(query).catch((err) => {
      cache.delete(key); // don't cache failures
      throw err;
    });
    cache.set(key, promise);
  }
  return cache.get(key);
}

async function request({ origin, destination, date, returnDate, cabin }) {
  const params = new URLSearchParams({ origin, destination, date, cabin });
  if (returnDate) params.set("return_date", returnDate);

  let res;
  try {
    res = await fetch(`${API_URL}/api/flights?${params}`);
  } catch {
    throw new Error("Can't reach the flight server. Is the backend running (python app.py)?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  const flights = mapSerpFlights(data, { origin, destination, date, returnDate, cabin });
  return convertToKes(flights);
}

// Show every price in shillings, whatever currency the source used.
async function convertToKes(flights) {
  if (flights.every((f) => f.currency === "KES")) return flights;

  const { rates, approximate } = await getRates();
  return flights
    .map((f) => {
      const kes = toKes(f.price, f.currency, rates);
      if (kes === null) return null; // a currency we can't convert:hide it
      const perUnit = rates.KES / rates[f.currency];
      const rate = perUnit < 10 ? perUnit.toFixed(2) : Math.round(perUnit);
      const note = ` Converted from ${f.currency} to KSh at about ${rate} per ${f.currency}${
        approximate ? " (approximate, live rates unavailable)" : ""
      }.`;

      return {
        ...f,
        price: kes,
        currency: "KES",
        tripSummary: f.tripSummary.replace(f.currency, "KSh"),
        providerNote: f.providerNote + note,
      };
    })
    .filter(Boolean);
}

// ---------- helpers ----------

const hm = (mins) =>
  Number.isFinite(mins) && mins >= 0
    ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`
    : null;
const clock = (stamp) => (stamp ? stamp.split(" ")[1] : "");
const prettyDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      })
    : null;

// "2026-12-14 06:55" -> a number we can subtract. Only ever used for two times at the SAME
// airport (a layover), so both are in that airport's local time and no time zones are needed.
function stampMs(stamp) {
  const m = /^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)$/.exec(stamp || "");
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
}

function minutesBetween(from, to) {
  const a = stampMs(from);
  const b = stampMs(to);
  if (a === null || b === null) return null;
  const mins = Math.round((b - a) / 60000);
  return mins >= 0 ? mins : null;
}

// Same flight = same id, in every search, and the same id the backend works out for a saved
// flight (flight_key() in backend/app.py: keep the two in sync).
function flightKey(segments) {
  const last = segments[segments.length - 1];
  return [...segments.map((s) => `${s.depCode}${s.depStamp ?? ""}`), last.arrCode]
    .join("-")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .slice(0, 190);
}

function emissionsNote(c) {
  if (!c || c.difference_percent == null) return "Emissions data not available";
  const p = c.difference_percent;
  if (p === 0) return "Carbon emissions typical for this route";
  return `Carbon emissions about ${Math.abs(p)}% ${p < 0 ? "lower" : "higher"} than typical for this route`;
}

// One direction of a trip (a list of legs in SerpApi's shape) -> what the UI draws.
// Fills in the things the source leaves out: layover lengths (next departure minus last
// arrival, same airport) and the total (every leg's flight time + every layover).
function buildTrip(legs, { totalDuration, layovers } = {}) {
  const first = legs[0];
  const last = legs[legs.length - 1];
  const stops = legs.length - 1;

  const gaps = legs.slice(0, -1).map((leg, i) => {
    const given = layovers?.[i];
    return {
      id: given?.id || leg.arrival_airport.id,
      name: given?.name || leg.arrival_airport.name || leg.arrival_airport.id,
      minutes:
        given?.duration ??
        minutesBetween(leg.arrival_airport.time, legs[i + 1].departure_airport.time),
    };
  });

  const flying = legs.map((l) => l.duration);
  const total =
    totalDuration ??
    (flying.every(Number.isFinite) && gaps.every((g) => g.minutes !== null)
      ? flying.reduce((a, b) => a + b, 0) + gaps.reduce((a, g) => a + g.minutes, 0)
      : null);

  const layoverTexts = gaps.map(
    (g) => `Layover${g.minutes !== null ? " · " + hm(g.minutes) : ""} in ${g.name} (${g.id})`,
  );

  return {
    airline: first.airline ?? null,
    airlineCode: first.flight_number?.split(" ")[0] || airlineCode(first.airline),
    flightNo: first.flight_number || null,
    route: `${first.departure_airport.id} → ${last.arrival_airport.id}`,
    depCode: first.departure_airport.id,
    arrCode: last.arrival_airport.id,
    depStamp: first.departure_airport.time ?? null,
    arrStamp: last.arrival_airport.time ?? null,
    departure: clock(first.departure_airport.time),
    arrival: clock(last.arrival_airport.time),
    duration: hm(total),
    stops: stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`,
    aircraft: first.airplane || null,
    segments: legs.map((leg) => ({
      code: leg.flight_number?.split(" ")[0] || airlineCode(leg.airline),
      depTime: clock(leg.departure_airport.time),
      depStamp: leg.departure_airport.time ?? null,
      arrStamp: leg.arrival_airport.time ?? null,
      airline: leg.airline ?? null,
      flightNumber: leg.flight_number ?? null,
      aircraft: leg.airplane ?? null,
      depCode: leg.departure_airport.id,
      depAirport: leg.departure_airport.name,
      flightInfo: [
        hm(leg.duration) && `Flight time ${hm(leg.duration)}`,
        [leg.airline, leg.flight_number].filter(Boolean).join(" "),
        leg.airplane || "Aircraft n/a",
      ]
        .filter(Boolean)
        .join(" · "),
      arrTime: clock(leg.arrival_airport.time),
      arrCode: leg.arrival_airport.id,
      arrAirport: leg.arrival_airport.name,
      tags: [leg.travel_class, ...(leg.extensions || [])].filter(Boolean).slice(0, 4),
    })),
    layoverTexts,
    layover: layoverTexts.length ? layoverTexts.join(" · ") : null,
  };
}

// Outbound + (optional) return -> the one flight object the UI uses.
function assembleFlight(out, back, m) {
  const roundTrip = Boolean(m.roundTrip || back);
  return {
    id: flightKey([...out.segments, ...(back ? back.segments : [])]),
    ...out, // outbound fields at the top level
    inbound: back ? { ...back, date: prettyDate(back.depStamp?.slice(0, 10)) } : null,
    roundTrip,
    bookingUrl: m.bookingUrl ?? null,
    price: m.price,
    currency: m.currency,
    rating: null, // neither source provides one
    cabin: m.cabin || "",
    co2Note: m.co2Note ?? null,
    outboundDate: m.outboundDate,
    returnDate: m.returnDate,
    tripSummary: `${m.currency === "KES" ? "KSh" : m.currency} ${roundTrip ? "round-trip" : "one-way"} · 1 adult${m.cabin ? " · " + m.cabin : ""}`,
    providerNote: m.providerNote,
  };
}

export function mapSerpFlights(data, query) {
  const currency = data.search_parameters?.currency || "KES";
  const groups = [...(data.best_flights || []), ...(data.other_flights || [])];
  const fetched = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const cabinLabel = { economy: "Economy", premium: "Premium economy", business: "Business", first: "First" }[query.cabin] || "Economy";

  // Ways back, cheapest first. (Their prices are one-way, so they're only used for ordering.)
  const returns = (data.return_flights || [])
    .filter((g) => g.flights?.length)
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
    .map((g) => buildTrip(g.flights, { totalDuration: g.total_duration, layovers: g.layovers }));

  const seenIds = new Set();

  return groups
    .map((g) => {
      const legs = g.flights || [];
      if (!legs.length || !g.price) return null;

      const out = buildTrip(legs, { totalDuration: g.total_duration, layovers: g.layovers });
      // Round-trip fares are normally on one airline, so prefer a return on the outbound's
      // airline, otherwise the cheapest return.
      const back = query.returnDate
        ? returns.find((r) => r.airline === out.airline) || returns[0] || null
        : null;

      const flight = assembleFlight(out, back, {
        roundTrip: Boolean(query.returnDate),
        bookingUrl: data.booking_url,
        price: g.price,
        currency,
        cabin: cabinLabel,
        co2Note: emissionsNote(g.carbon_emissions),
        outboundDate: prettyDate(query.date),
        returnDate: prettyDate(query.returnDate),
        providerNote: `Prices from Google Flights via ${data.source === "fast-flights" ? "fast-flights" : "SerpApi"}. Fetched ${fetched}. Prices and availability may change. Anga360 does not sell tickets.`,
      });

      if (seenIds.has(flight.id)) return null;
      seenIds.add(flight.id);
      return flight;
    })
    .filter(Boolean);
}

// A saved flight comes back from the backend as plain rows (see GET /api/saved-flights):
// { id, destination, price, currency, segments: [{ origin, destination, departure, ... }] }.
// Rebuild the same flight object a search result has. Flight times per leg aren't stored,
// so those (and the total) are simply left out; layovers are still worked out from the times.
export function savedToFlight(row) {
  const toLeg = (s) => ({
    departure_airport: { id: s.origin, name: s.origin_name || s.origin, time: s.departure },
    arrival_airport: { id: s.destination, name: s.destination_name || s.destination, time: s.arrival },
    airline: s.airline,
    flight_number: s.flight_number,
    airplane: s.aircraft,
    duration: null,
  });

  const segs = row.segments;
  // the way back starts at the first later leg that leaves from where the outbound ends
  let split = segs.findIndex((s, i) => i > 0 && s.origin === row.destination);
  if (split === -1) split = segs.length;

  const out = buildTrip(segs.slice(0, split).map(toLeg));
  const back = split < segs.length ? buildTrip(segs.slice(split).map(toLeg)) : null;

  return {
    ...assembleFlight(out, back, {
      price: row.price,
      currency: row.currency || "KES",
      outboundDate: prettyDate(out.depStamp?.slice(0, 10)),
      returnDate: prettyDate(back?.depStamp?.slice(0, 10)),
      providerNote: "Saved flight. Prices and availability may change. Anga360 does not sell tickets.",
    }),
    id: row.id,
  };
}
