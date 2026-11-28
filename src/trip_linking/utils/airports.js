export const AIRPORTS = {
  NBO: { city: "Nairobi", name: "Nairobi Jomo Kenyatta", lat: -1.3192, lon: 36.9278 },
  MBA: { city: "Mombasa", name: "Mombasa Moi International", lat: -4.0348, lon: 39.5942 },
  KIS: { city: "Kisumu", name: "Kisumu International", lat: -0.0862, lon: 34.7289 },
  EBB: { city: "Entebbe", name: "Entebbe International", lat: 0.0424, lon: 32.4435 },
  KGL: { city: "Kigali", name: "Kigali International", lat: -1.9686, lon: 30.1395 },
  DAR: { city: "Dar es Salaam", name: "Julius Nyerere International", lat: -6.8781, lon: 39.2026 },
  JRO: { city: "Kilimanjaro", name: "Kilimanjaro International", lat: -3.4294, lon: 37.0745 },
  ZNZ: { city: "Zanzibar", name: "Abeid Amani Karume International", lat: -6.222, lon: 39.2249 },
  ADD: { city: "Addis Ababa", name: "Addis Ababa Bole", lat: 8.9779, lon: 38.7993 },
  JNB: { city: "Johannesburg", name: "Johannesburg O. R. Tambo", lat: -26.1392, lon: 28.246 },
  CPT: { city: "Cape Town", name: "Cape Town International", lat: -33.9715, lon: 18.6021 },
  LOS: { city: "Lagos", name: "Murtala Muhammed International", lat: 6.5774, lon: 3.3212 },
  ACC: { city: "Accra", name: "Kotoka International", lat: 5.6052, lon: -0.1668 },
  CAI: { city: "Cairo", name: "Cairo International", lat: 30.1219, lon: 31.4056 },
  LUN: { city: "Lusaka", name: "Kenneth Kaunda International", lat: -15.3308, lon: 28.4526 },
  HRE: { city: "Harare", name: "Robert Gabriel Mugabe International", lat: -17.9318, lon: 31.0928 },
  DXB: { city: "Dubai", name: "Dubai International", lat: 25.2532, lon: 55.3657 },
  AUH: { city: "Abu Dhabi", name: "Zayed International", lat: 24.4331, lon: 54.6511 },
  DOH: { city: "Doha", name: "Hamad International", lat: 25.2731, lon: 51.6081 },
  JED: { city: "Jeddah", name: "King Abdulaziz International", lat: 21.6796, lon: 39.1565 },
  IST: { city: "Istanbul", name: "Istanbul Airport", lat: 41.2753, lon: 28.7519 },
  LHR: { city: "London", name: "London Heathrow", lat: 51.47, lon: -0.4543 },
  LGW: { city: "London", name: "London Gatwick", lat: 51.1537, lon: -0.1821 },
  CDG: { city: "Paris", name: "Paris Charles de Gaulle", lat: 49.0097, lon: 2.5479 },
  AMS: { city: "Amsterdam", name: "Amsterdam Schiphol", lat: 52.3105, lon: 4.7683 },
  FRA: { city: "Frankfurt", name: "Frankfurt am Main", lat: 50.0379, lon: 8.5622 },
  MAD: { city: "Madrid", name: "Madrid Barajas", lat: 40.4983, lon: -3.5676 },
  BOM: { city: "Mumbai", name: "Chhatrapati Shivaji Maharaj", lat: 19.0896, lon: 72.8656 },
  SIN: { city: "Singapore", name: "Singapore Changi", lat: 1.3644, lon: 103.9915 },
  JFK: { city: "New York", name: "New York JFK", lat: 40.6413, lon: -73.7781 },
};

// Airline code on a ticket (2 letters) -> code used in radio callsigns (3 letters).
// Airlines not listed here are tried with the 2 letters as they are, which rarely matches,
// so add the airline here if a flight can't be found.
const CALLSIGN_PREFIX = {
  BA: "BAW", ET: "ETH", KQ: "KQA", TK: "THY", EK: "UAE", QR: "QTR", EY: "ETD", SV: "SVA",
  AF: "AFR", KL: "KLM", LH: "DLH", VS: "VIR", LX: "SWR", SN: "BEL", IB: "IBE", TP: "TAP",
  SA: "SAA", MS: "MSR", WB: "RWD", PW: "PRF", TC: "ATC", UG: "UGD", HM: "SEY", ME: "MEA",
  AI: "AIC", SQ: "SIA", DL: "DAL", UA: "UAL", AA: "AAL", AT: "RAM", W3: "ARA", FZ: "FDB",
  J9: "JZR", G9: "ABY", WY: "OMA", RJ: "RJA", MK: "MAU", FA: "SFR", ZA: "SKY",
};

export function flightToCallsign(flight) {
  const clean = flight.replace(/\s+/g, "").toUpperCase();
  if (/^[A-Z]{3}\d/.test(clean)) return clean;
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
