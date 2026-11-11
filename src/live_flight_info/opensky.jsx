import { useState,useEffect } from "react";
import axios from "axios";
const OPENSKY_BASE = "/opensky-api/api";
export async function getAccessToken(){
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'professor_panic-api-client',
        client_secret:'ist7seyqkSTC1hgk9GG7Sh571UbxJfpL',
    });
    const res = await axios.post(
    '/opensky-auth/auth/realms/opensky-network/protocol/openid-connect/token',
    params
  );

  return res.data.access_token;
}
// Maps the `type` argument to an OpenSky endpoint
const ENDPOINTS = {
  states: "/states/all",             // live aircraft: { lamin, lomin, lamax, lomax, icao24, time }
  flights: "/flights/all",           // all flights in a time window: { begin, end } (max 2 hours)
  aircraft: "/flights/aircraft",     // flights for one aircraft: { icao24, begin, end }
  arrival: "/flights/arrival",       // arrivals at an airport: { airport, begin, end }
  departure: "/flights/departure",   // departures from an airport: { airport, begin, end }
  track: "/tracks",                  // trajectory of an aircraft: { icao24, time }
};
export async function getOpenSkyData(token, request = {}, type = "states") {
  const endpoint = ENDPOINTS[type];
  if (!endpoint) {
    throw new Error(
      `Unknown type "${type}". Use one of: ${Object.keys(ENDPOINTS).join(", ")}`
    );
  }

  try {
    const res = await axios.get(`${OPENSKY_BASE}${endpoint}`, {
      params: request, // axios builds the query string and skips undefined values
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (type === "states") {
      return (res.data.states || []).map(s => ({
        icao24: s[0],
        callsign: s[1]?.trim(),
        originCountry: s[2],
        longitude: s[5],
        latitude: s[6],
        altitude: s[7],        // i think in meters
        onGround: s[8],
        velocity: s[9],        // m/s
        heading: s[10],        // degrees from north
        verticalRate: s[11],
      }));
    }
    return res.data;
  } catch (err) {
    const status = err.response?.status;

    if (status === 404) return []; // OpenSky returns 404 when nothing matches
    if (status === 401) throw new Error("Invalid or expired token");
    if (status === 429) throw new Error("Rate limit reached, try again later");

    console.error("getOpenSkyData failed:", err);
    throw err;
  }
}