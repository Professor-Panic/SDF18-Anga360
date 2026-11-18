// The backend makes 8-character codes from letters and digits that are easy
// to read aloud (no 0/O, 1/I/L), like "K7F3QX2M".

// Cleans up whatever the user typed. "k7f3-qx2m", "K7F3 QX2M" and "K7F3QX2M"
// all become "K7F3QX2M". Returns null if it can't be a valid code.
export function normalizeInviteCode(raw) {
  const cleaned = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.length === 8 ? cleaned : null;
}

// For display only: "K7F3QX2M" -> "K7F3-QX2M". Send the plain code to the backend.
export function formatInviteCode(code) {
  return code && code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code ?? "";
}
