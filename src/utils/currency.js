// Everything on screen is shown in Kenyan shillings (KSh).
// Flight prices arrive in whatever currency Google returns (USD for the free source),
// so we convert them once, when the results load.

import { API_URL } from "../api/config.js";

// Our backend fetches the rates once and shares them (see backend/services/rates.py).
const RATES_URL = `${API_URL}/api/rates`;
const CACHE_KEY = "anga_fx_rates";
const CACHE_HOURS = 12;
const FALLBACK = { USD: 1, KES: 129 }; // only used if the rate service can't be reached

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

let inflight = null;

// -> { rates: { USD: 1, KES: 129.1, EUR: ... }, approximate: boolean }
export function getRates() {
  const cached = readCache();
  const fresh = cached && Date.now() - cached.savedAt < CACHE_HOURS * 3600 * 1000;
  if (fresh) return Promise.resolve({ rates: cached.rates, approximate: false });

  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch(RATES_URL, { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        if (!res.ok || !data.rates?.KES) throw new Error("bad rates");
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rates: data.rates }));
        } catch {
          /* storage blocked, fine */
        }
        return { rates: data.rates, approximate: Boolean(data.stale) }; // stale = the server's last known rates
      } catch {
        // an old rate is better than a made-up one
        return cached
          ? { rates: cached.rates, approximate: true }
          : { rates: FALLBACK, approximate: true };
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

// Whole shillings. Returns null if we don't know that currency.
export function toKes(amount, from, rates) {
  if (from === "KES") return Math.round(amount);
  if (!rates[from] || !rates.KES) return null;
  return Math.round((amount / rates[from]) * rates.KES);
}

// 119067 -> "KSh 119,067"
export function formatKes(amount) {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}
