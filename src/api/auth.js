import { API_URL } from "./config.js";

const TOKEN_KEY = "anga_token";
const USER_KEY = "anga_user";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// ---------- session storage (localStorage can be blocked, so always try/catch) ----------

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage blocked: the user stays logged in until they refresh */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

// ---------- requests ----------

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

export async function signup({ fullName, email, password }) {
  const data = await post("/api/signup", { full_name: fullName, email, password });
  saveSession(data.token, data.user);
  return data.user;
}

export async function login({ email, password }) {
  const data = await post("/api/login", { email, password });
  saveSession(data.token, data.user);
  return data.user;
}

export function logout() {
  clearSession();
}

// For any route that needs a logged-in user (invites, linked trips, ...).
// If the server says the token is bad or expired, we log the user out everywhere.
export async function authFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (res.status === 401) {
    clearSession();
    window.dispatchEvent(new Event("anga:logout"));
  }
  return res;
}
