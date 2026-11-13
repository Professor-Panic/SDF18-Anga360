// Letters and digits that are easy to read aloud (no 0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(count) {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => ALPHABET[v % ALPHABET.length]).join("");
}

// Front-end placeholder. The backend will generate real codes (FR-15).
export function generateInviteCode() {
  return `${randomChars(3)}-${randomChars(3)}`;
}

// "k7f3qx", "K7F 3QX" and "K7F-3QX" all become "K7F-3QX". Returns null if invalid.
export function normalizeInviteCode(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 6) return null;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}