
import os
import re
import threading
import time
import urllib.error
import urllib.parse

from . import adsb_lol
from .http_client import UpstreamError, request_json

TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
API_BASE = "https://opensky-network.org/api"

def _number(low, high):
    def check(value):
        number = float(value)  # "nan"/"inf" fail the range test below
        if not low <= number <= high:
            raise ValueError
        return number

    return check


def _whole(value):
    number = int(value)
    if not 0 <= number <= 4_102_444_800:  # unix seconds, up to the year 2100
        raise ValueError
    return number


def _icao24(value):  # an aircraft's 24-bit address, 6 hex characters
    if not re.fullmatch(r"[0-9a-fA-F]{6}", value):
        raise ValueError
    return value.lower()


def _airport(value):  # ICAO airport code, e.g. HKJK (not the 3-letter IATA one)
    if not re.fullmatch(r"[A-Za-z]{4}", value):
        raise ValueError
    return value.upper()


def _callsign(value):  # e.g. KQA100 or BAW65 (OpenSky and adsb.lol both use these)
    value = value.strip().upper()
    if not re.fullmatch(r"[A-Z0-9]{3,8}", value):
        raise ValueError
    return value


_LAT, _LON = _number(-90, 90), _number(-180, 180)
_FLIGHT_WINDOW = {"begin": _whole, "end": _whole}

# kind -> (OpenSky path, {allowed parameter: checker}, parameters that must be present)
ENDPOINTS = {
    "states": (
        "/states/all",
        # "callsign" is not an OpenSky option: adsb.lol looks the flight up by it directly, and
        # on the OpenSky fallback we filter the results by it ourselves (see query())
        {"lamin": _LAT, "lomin": _LON, "lamax": _LAT, "lomax": _LON, "icao24": _icao24, "time": _whole,
         "callsign": _callsign},
        set(),
    ),
    "flights": ("/flights/all", _FLIGHT_WINDOW, {"begin", "end"}),
    "aircraft": ("/flights/aircraft", {"icao24": _icao24, **_FLIGHT_WINDOW}, {"icao24", "begin", "end"}),
    "arrival": ("/flights/arrival", {"airport": _airport, **_FLIGHT_WINDOW}, {"airport", "begin", "end"}),
    "departure": ("/flights/departure", {"airport": _airport, **_FLIGHT_WINDOW}, {"airport", "begin", "end"}),
    "track": ("/tracks", {"icao24": _icao24, "time": _whole}, {"icao24"}),
}
_BOX = {"lamin", "lomin", "lamax", "lomax"}


def _clean(kind, raw):
    """Check the query-string values for `kind`; returns them converted, or raises a 400."""
    _path, allowed, required = ENDPOINTS[kind]
    clean = {}
    for name, value in raw.items():
        if name not in allowed:
            raise UpstreamError(f'"{name}" is not a valid option for "{kind}".', 400)
        try:
            clean[name] = allowed[name](value)
        except (ValueError, TypeError):
            raise UpstreamError(f'Bad value for "{name}".', 400) from None
    missing = required - clean.keys()
    if missing:
        raise UpstreamError(f"Missing: {', '.join(sorted(missing))}.", 400)
    if kind == "states" and _BOX & clean.keys() and not _BOX <= clean.keys():
        raise UpstreamError("A search area needs all four of lamin, lomin, lamax, lomax.", 400)
    return clean


# ---------- OAuth token (valid 30 minutes; one is shared by every request) ----------

_token = {"value": None, "expires": 0.0}
_token_lock = threading.Lock()
_warned_anonymous = False


def _get_token(force=False):
    global _warned_anonymous
    client_id = os.getenv("OPENSKY_CLIENT_ID")
    client_secret = os.getenv("OPENSKY_CLIENT_SECRET")
    if not (client_id and client_secret):
        if not _warned_anonymous:
            print("OpenSky: no OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET set, using anonymous access (low limits).")
            _warned_anonymous = True
        return None

    with _token_lock:
        if not force and _token["value"] and time.time() < _token["expires"]:
            return _token["value"]
        try:
            data = request_json(
                TOKEN_URL,
                data={"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret},
            )
        except urllib.error.HTTPError as e:
            print(f"OpenSky token request failed with HTTP {e.code}")
            raise UpstreamError(
                "OpenSky rejected this server's login. Check OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET.", 502
            ) from e
        token = data.get("access_token") if isinstance(data, dict) else None
        if not token:
            raise UpstreamError("OpenSky didn't hand out an access token.", 502)
        try:
            lifetime = int(data.get("expires_in", 1800))
        except (TypeError, ValueError):
            lifetime = 1800
        _token["value"] = token
        _token["expires"] = time.time() + max(60, lifetime - 60)  # refresh a minute early
        return token


# ---------- short-lived response cache ----------

CACHE_SECONDS = 30
MAX_CACHE_ENTRIES = 300
_cache = {}  # key -> (expires_at, value)
_cache_lock = threading.Lock()


def _cache_get(key):
    with _cache_lock:
        item = _cache.get(key)
        if item and item[0] > time.time():
            return item[1]
        _cache.pop(key, None)
    return None


def _cache_put(key, value):
    with _cache_lock:
        now = time.time()
        if len(_cache) >= MAX_CACHE_ENTRIES:
            for stale in [k for k, (expires, _v) in _cache.items() if expires <= now]:
                del _cache[stale]
            while len(_cache) >= MAX_CACHE_ENTRIES:  # still full: drop the oldest
                _cache.pop(next(iter(_cache)))
        _cache[key] = (now + CACHE_SECONDS, value)

def _problem(e):
    """Turn one of OpenSky's HTTP errors into the error we answer our own caller with."""
    print(f"OpenSky answered HTTP {e.code} for {e.url}")
    if e.code == 429:
        return UpstreamError("OpenSky's rate limit was reached. Try again in a few minutes.", 429)
    if e.code in (401, 403):
        return UpstreamError(
            "OpenSky refused this server's request (bad credentials, or the host may be blocked).", 502
        )
    return UpstreamError(f"OpenSky answered with an error ({e.code}).", 502)


def _call(path, params):
    url = API_BASE + path + ("?" + urllib.parse.urlencode(params) if params else "")
    for attempt in (1, 2):
        token = _get_token(force=attempt == 2)
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        try:
            return request_json(url, headers=headers)
        except urllib.error.HTTPError as e:
            if e.code == 404:  # OpenSky's way of saying "nothing matches"
                return None
            if e.code == 401 and token and attempt == 1:
                continue  # the token may have been revoked early: fetch a fresh one and retry once
            raise _problem(e) from e
    raise UpstreamError("OpenSky didn't accept the login.", 502)

def _at(row, index):
    """row[index], or None when OpenSky sent a shorter row than we expected."""
    return row[index] if len(row) > index else None


def _shape(kind, raw):
    if raw is None:
        return []
    if kind != "states":
        return raw
    states = raw.get("states") if isinstance(raw, dict) else None
    return [
        {
            "icao24": _at(s, 0),
            "callsign": (_at(s, 1) or "").strip() or None,
            "originCountry": _at(s, 2),
            "longitude": _at(s, 5),
            "latitude": _at(s, 6),
            "altitude": _at(s, 7),  # metres
            "onGround": _at(s, 8),
            "velocity": _at(s, 9),  # m/s
            "heading": _at(s, 10),  # degrees clockwise from north
            "verticalRate": _at(s, 11),
        }
        for s in (states or [])
    ]


def query(kind, raw_params):
    if kind not in ENDPOINTS:
        raise UpstreamError(f'Unknown type "{kind}". Use one of: {", ".join(ENDPOINTS)}.', 400)
    params = _clean(kind, raw_params)

    key = (kind, tuple(sorted(params.items())))
    cached = _cache_get(key)
    if cached is not None:
        return cached

    callsign = params.pop("callsign", None)  # never sent to OpenSky, it has no such option

    result = None
    if kind == "states":
        result = _try_adsb(callsign, params)  # first choice; None means "ask OpenSky instead"

    if result is None:
        # fallback: the original OpenSky code path
        result = _shape(kind, _call(ENDPOINTS[kind][0], params))
        if callsign:
            result = [p for p in result if p["callsign"] == callsign]

    _cache_put(key, result)
    return result


def _try_adsb(callsign, params):
    """Ask adsb.lol first. Returns the planes, or None when OpenSky should answer instead:
    adsb.lol can't do this kind of search, it failed, or (only if ADSB_FALLBACK_ON_EMPTY=1)
    it found nothing. By default "nothing found" is accepted as the answer, so an idle flight
    doesn't send a slow OpenSky request every time the page polls."""
    try:
        planes = adsb_lol.states(callsign, params)
    except UpstreamError as e:
        print(f"adsb.lol failed ({e.message}), falling back to OpenSky")
        return None
    if planes == [] and os.getenv("ADSB_FALLBACK_ON_EMPTY") == "1":
        return None
    return planes
