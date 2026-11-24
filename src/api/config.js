export const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error("VITE_URL is not set,backend on localhost.");
}
