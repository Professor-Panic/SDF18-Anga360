// Official sites, matched on part of the airline name Google gives us
// (it says "Etihad", "Ethiopian", "Kenya Airways", ...).
const SITES = [
  ["etihad", "https://www.etihad.com"],
  ["ethiopian", "https://www.ethiopianairlines.com"],
  ["kenya airways", "https://www.kenya-airways.com"],
  ["rwandair", "https://www.rwandair.com"],
  ["emirates", "https://www.emirates.com"],
  ["qatar", "https://www.qatarairways.com"],
  ["turkish", "https://www.turkishairlines.com"],
  ["klm", "https://www.klm.com"],
  ["air france", "https://www.airfrance.com"],
  ["british airways", "https://www.britishairways.com"],
  ["lufthansa", "https://www.lufthansa.com"],
  ["swiss", "https://www.swiss.com"],
  ["korean air", "https://www.koreanair.com"],
  ["asiana", "https://flyasiana.com"],
  ["saudia", "https://www.saudia.com"],
  ["egyptair", "https://www.egyptair.com"],
  ["air india", "https://www.airindia.com"],
  ["singapore", "https://www.singaporeair.com"],
  ["cathay", "https://www.cathaypacific.com"],
  ["flydubai", "https://www.flydubai.com"],
  ["gulf air", "https://www.gulfair.com"],
  ["oman air", "https://www.omanair.com"],
  ["royal air maroc", "https://www.royalairmaroc.com"],
  ["virgin atlantic", "https://www.virginatlantic.com"],
  ["air tanzania", "https://www.airtanzania.co.tz"],
  ["uganda airlines", "https://www.ugandairlines.com"],
  ["jambojet", "https://www.jambojet.com"],
  ["china southern", "https://www.csair.com"],
  ["china eastern", "https://www.ceair.com"],
  ["air china", "https://www.airchina.com"],
  ["japan airlines", "https://www.jal.co.jp"],
];

export function airlineSite(name) {
  const n = (name || "").toLowerCase();
  return SITES.find(([key]) => n.includes(key))?.[1] ?? null;
}

// Where "Continue to provider" goes: the airline's own site if we know it,
// otherwise this search on Google Flights.
export function providerUrl(flight) {
  return airlineSite(flight.airline) || flight.bookingUrl || null;
}

// Two-letter airline (IATA) codes, matched the same way. Used for the little "ET" / "KQ" chip
// when the flight source doesn't give us a flight number.
const CODES = [
  ["etihad", "EY"],
  ["ethiopian", "ET"],
  ["kenya airways", "KQ"],
  ["rwandair", "WB"],
  ["emirates", "EK"],
  ["qatar", "QR"],
  ["turkish", "TK"],
  ["klm", "KL"],
  ["air france", "AF"],
  ["british airways", "BA"],
  ["lufthansa", "LH"],
  ["swiss", "LX"],
  ["korean air", "KE"],
  ["asiana", "OZ"],
  ["saudia", "SV"],
  ["egyptair", "MS"],
  ["air india", "AI"],
  ["singapore", "SQ"],
  ["cathay", "CX"],
  ["flydubai", "FZ"],
  ["gulf air", "GF"],
  ["oman air", "WY"],
  ["royal air maroc", "AT"],
  ["virgin atlantic", "VS"],
  ["air tanzania", "TC"],
  ["uganda airlines", "UR"],
  ["jambojet", "JM"],
  ["china southern", "CZ"],
  ["china eastern", "MU"],
  ["air china", "CA"],
  ["japan airlines", "JL"],
  ["south african", "SA"],
  ["brussels", "SN"],
  ["precision air", "PW"],
  ["air peace", "P4"],
  ["delta", "DL"],
  ["united", "UA"],
  ["american airlines", "AA"],
  ["air canada", "AC"],
  ["aer lingus", "EI"],
  ["iberia", "IB"],
  ["tap air portugal", "TP"],
  ["ita airways", "AZ"],
  ["pegasus", "PC"],
  ["wizz", "W6"],
  ["ryanair", "FR"],
  ["easyjet", "U2"],
];

export function airlineCode(name) {
  const n = (name || "").toLowerCase();
  return CODES.find(([key]) => n.includes(key))?.[1] ?? "";
}
