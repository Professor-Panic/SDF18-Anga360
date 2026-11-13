export function formatDate(iso) {
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

export function routeLabel(trip) {
  const { origin, destination } = trip;
  if (!origin?.code || !destination?.code) return "Route to be confirmed";
  return `${origin.city} (${origin.code}) → ${destination.city} (${destination.code})`;
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