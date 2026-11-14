// "Leave now" calculation: estimated arrival minus the time the
// picker-upper needs for traffic, parking and the walk to arrivals.

function toMinutes(hhmm) {
  if (typeof hhmm !== "string" || !/^\d{2}:\d{2}$/.test(hhmm)) {
    return null;
  }

  const [h, m] = hhmm.split(":").map(Number);

  if (h > 23 || m > 59) return null;

  return h * 60 + m;
}

function fromMinutes(total) {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function totalAllowance({ traffic = 0, parking = 0, walk = 0 } = {}) {
  return traffic + parking + walk;
}

export function calculateLeaveBy(estimatedArrival, allowances) {
  const arrivalMinutes = toMinutes(estimatedArrival);

  if (arrivalMinutes === null) return null;

  return fromMinutes(arrivalMinutes - totalAllowance(allowances));
}
