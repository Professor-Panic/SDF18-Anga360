export function formatDate(iso) {
  if (!iso) return "Date to be confirmed";
  const date = new Date(`${iso}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`;
}

function place({ city, code }) {
  return city && city !== code ? `${city} (${code})` : code;
}

export function routeLabel(trip) {
  const { origin, destination } = trip;
  if (origin?.code && destination?.code) return `${place(origin)} → ${place(destination)}`;
  if (destination?.code) return `Arriving ${place(destination)}`;
  if (origin?.code) return `From ${place(origin)}`;
  return "Route to be confirmed";
}

// An ISO timestamp from the backend -> "14:08" in the viewer's time zone.
export function clockOf(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function firstName(fullName) {
  return fullName.split(" ")[0];
}