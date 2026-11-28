"""adsb.lol: the FIRST source for live aircraft positions (OpenSky is the fallback, see opensky.py).

Why first: adsb.lol is a free, open ADS-B network that answers cloud hosts like Render, and a
callsign lookup is one small request instead of OpenSky's whole-region download.

Everything here returns the same shape opensky.py produces, so the frontend can't tell which
source answered:
    { icao24, callsign, originCountry, longitude, latitude, altitude (m),
      onGround, velocity (m/s), heading, verticalRate (m/s) }

Optional env var:  ADSBLOL_API_KEY  (free key from adsb.lol: raises the daily limit; sent as x-api-key)
Without a key the limit is about 500 requests per day per IP.
"""

import math
import os
import urllib.error
import urllib.parse

from .http_client import UpstreamError, request_json

BASE = "https://api.adsb.lol/v2"
MAX_RADIUS_NM = 250  # the point/radius search refuses anything larger
FEET_TO_M = 0.3048
KNOTS_TO_MS = 0.514444
FPM_TO_MS = 0.00508  # feet per minute -> metres per second


def _get(path):
    headers = {"User-Agent": "anga360/1.0"}
    key = os.getenv("ADSBLOL_API_KEY")
    if key:
        headers["x-api-key"] = key
    try:
        return request_json(BASE + path, headers=headers, timeout=10)
    except urllib.error.HTTPError as e:
        if e.code == 404:  # "nothing matches"
            return {}
        print(f"adsb.lol answered HTTP {e.code} for {e.url}")
        raise UpstreamError(f"adsb.lol answered with an error ({e.code}).", 429 if e.code == 429 else 502) from e


def _shape(ac):
    altitude_ft = ac.get("alt_baro")
    on_ground = altitude_ft == "ground"  # adsb.lol sends the word instead of a number
    if on_ground:
        altitude_m = 0
    elif isinstance(altitude_ft, (int, float)):
        altitude_m = altitude_ft * FEET_TO_M
    else:
        altitude_m = None
    speed, rate = ac.get("gs"), ac.get("baro_rate")
    return {
        "icao24": (ac.get("hex") or "").lower() or None,
        "callsign": (ac.get("flight") or "").strip().upper() or None,
        "originCountry": None,  # adsb.lol doesn't say
        "longitude": ac.get("lon"),
        "latitude": ac.get("lat"),
        "altitude": altitude_m,
        "onGround": on_ground,
        "velocity": speed * KNOTS_TO_MS if isinstance(speed, (int, float)) else None,
        "heading": ac.get("track"),
        "verticalRate": rate * FPM_TO_MS if isinstance(rate, (int, float)) else None,
    }


def _nautical_miles(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 3440.065 * 2 * math.asin(math.sqrt(a))


def states(callsign=None, params=None):
    """Live aircraft, in OpenSky's "states" shape.

    Returns None when adsb.lol can't answer THIS kind of question (so the caller should go to
    OpenSky): a whole-world search, a box wider than 250 nm, or a historical `time`.
    Raises UpstreamError when adsb.lol itself fails.
    """
    params = params or {}
    if "time" in params:  # adsb.lol is live only
        return None

    box = None
    if callsign:
        path = f"/callsign/{urllib.parse.quote(callsign)}"
    elif "icao24" in params:
        path = f"/hex/{params['icao24']}"
    elif {"lamin", "lomin", "lamax", "lomax"} <= params.keys():
        box = params
        lat = (box["lamin"] + box["lamax"]) / 2
        lon = (box["lomin"] + box["lomax"]) / 2
        radius = math.ceil(_nautical_miles(lat, lon, box["lamax"], box["lomax"]))
        if radius > MAX_RADIUS_NM:
            return None
        path = f"/point/{lat:.4f}/{lon:.4f}/{max(radius, 1)}"
    else:
        return None  # no filter at all = the whole world, which only OpenSky offers

    raw = _get(path)
    planes = [_shape(ac) for ac in (raw.get("ac") or [])] if isinstance(raw, dict) else []

    if box:  # the search area is a circle around the box, so cut it back to the box
        planes = [
            p for p in planes
            if p["latitude"] is not None and p["longitude"] is not None
            and box["lamin"] <= p["latitude"] <= box["lamax"]
            and box["lomin"] <= p["longitude"] <= box["lomax"]
        ]
    return planes
