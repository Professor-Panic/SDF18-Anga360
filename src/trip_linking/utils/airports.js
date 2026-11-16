// Airports the globe can draw. Add more here when a trip uses a new airport code.
export const AIRPORTS = {
  LHR: { name: "London Heathrow", lat: 51.47, lon: -0.4543 },
  NBO: { name: "Nairobi Jomo Kenyatta", lat: -1.3192, lon: 36.9278 },
  ADD: { name: "Addis Ababa Bole", lat: 8.9779, lon: 38.7993 },
  DXB: { name: "Dubai International", lat: 25.2532, lon: 55.3657 },
  JNB: { name: "Johannesburg O. R. Tambo", lat: -26.1392, lon: 28.246 },
};

// Airline code on a ticket (2 letters) -> code used in radio callsigns (3 letters).
const CALLSIGN_PREFIX = { BA: "BAW", ET: "ETH", KQ: "KQA", TK: "THY", EK: "UAE" };

// "BA 65" or "BA65" -> "BAW65". OpenSky identifies aircraft by callsign.
export function flightToCallsign(flight) {
  const clean = flight.replace(/\s+/g, "").toUpperCase();
  const code = clean.slice(0, 2);
  const number = clean.slice(2);
  return (CALLSIGN_PREFIX[code] || code) + number;
}

// Distance over the Earth's surface in km (haversine formula).
export function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}