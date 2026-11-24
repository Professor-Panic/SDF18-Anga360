import os
import re
import secrets
from contextlib import asynccontextmanager
from datetime import date, datetime

import psycopg
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from psycopg.types.json import Json
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

# Load backend/.env no matter where you launch the server from
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from auth import create_token, get_current_user, hash_password, verify_password  # noqa: E402
from db import get_db  # noqa: E402
from services.http_client import UpstreamError  # noqa: E402
from services.opensky import query as opensky_query  # noqa: E402
from services.rates import get_rates  # noqa: E402
from services.flight_service import get_live_flights  # noqa: E402



@asynccontextmanager
async def lifespan(_app):
    ensure_schema()
    yield


app = FastAPI(lifespan=lifespan)

# Which websites may call this API from a browser. On the host, set CORS_ORIGINS to the
# frontend's address (comma-separated for several, no trailing slash):
#   CORS_ORIGINS=https://anga.vercel.app
# Localhost stays allowed so `npm run dev` keeps working.
CORS_ORIGINS = [o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


# Render pings this to know the service is up. No database, so it answers instantly.
@app.get("/health")
def health():
    return {"ok": True}


# ---------- one error shape for everything: {"error": "..."} ----------

@app.exception_handler(StarletteHTTPException)
async def http_error(request, exc):
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    first = exc.errors()[0]
    field = ".".join(str(p) for p in first["loc"][1:])
    return JSONResponse({"error": f"{field}: {first['msg']}".strip(": ")}, status_code=422)


def error(message, status):
    return JSONResponse({"error": message}, status_code=status)


# ---------- accounts ----------

EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# bcrypt silently ignores everything past 72 bytes, so refuse longer passwords
MAX_PW_BYTES = 72
# used when the email doesn't exist, so "no such user" takes as long as "wrong password"
DUMMY_HASH = hash_password("not-a-real-password")


class SignupBody(BaseModel):
    full_name: str
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


@app.post("/api/signup", status_code=201)
def signup(body: SignupBody, db=Depends(get_db)):
    email = body.email.strip().lower()
    name = body.full_name.strip()

    if not name:
        raise HTTPException(400, "Name is required")
    if not EMAIL.match(email):
        raise HTTPException(400, "Enter a valid email address")
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if len(body.password.encode()) > MAX_PW_BYTES:
        raise HTTPException(400, "Password is too long (72 bytes max)")

    try:
        user = db.execute(
            """INSERT INTO users (full_name, email, password_hash)
               VALUES (%s, %s, %s) RETURNING id, full_name, email""",
            (name, email, hash_password(body.password)),
        ).fetchone()
        db.commit()
    except psycopg.errors.UniqueViolation:
        db.rollback()
        raise HTTPException(409, "An account with that email already exists")

    return {"token": create_token(user["id"]), "user": user}


@app.post("/api/login")
def login(body: LoginBody, db=Depends(get_db)):
    email = body.email.strip().lower()
    user = db.execute(
        "SELECT id, full_name, email, password_hash FROM users WHERE email = %s", (email,)
    ).fetchone()

    # always run bcrypt, and give one message for both failures,
    # so an attacker can't tell which emails have accounts
    ok = verify_password(body.password, user["password_hash"] if user else DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(401, "Invalid email or password")

    user.pop("password_hash")
    return {"token": create_token(user["id"]), "user": user}


# ---------- flights ----------

IATA = re.compile(r"^[A-Za-z]{3}$")


def valid_date(value):
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except (TypeError, ValueError):
        return False


# plain `def` (not async): the search blocks on the network, FastAPI runs it in a thread
@app.get("/api/flights")
def flights(
    origin: str = "",
    destination: str = "",
    date: str = "",
    return_date: str | None = None,
    cabin: str = "economy",
):
    return_date = return_date or None

    if not (IATA.match(origin) and IATA.match(destination)):
        return error("origin and destination must be 3-letter airport codes, e.g. NBO", 400)
    if not valid_date(date) or (return_date and not valid_date(return_date)):
        return error("dates must look like YYYY-MM-DD", 400)
    dep = datetime.strptime(date, "%Y-%m-%d").date()
    if dep < datetime.now().date():
        return error("The departure date can't be in the past", 400)
    if return_date and datetime.strptime(return_date, "%Y-%m-%d").date() < dep:
        return error("The return date must be on or after the departure date", 400)

    try:
        data = get_live_flights(origin, destination, date, return_date, cabin)
    except Exception as e:  # Google changed its format, got blocked, network down, ...
        detail = (
            getattr(e, "error", None)
            or getattr(getattr(e, "response", None), "text", None)
            or str(e)
        )
        print("Flight search error:", detail)
        return error(str(detail), 500)

    if "error" in data:
        return error(data["error"], 502)
    return data


# ---------- other services, called from here so keys and tokens stay on the server ----------

# Live aircraft positions from OpenSky. Logged-in users only: every call spends OpenSky credits.
@app.get("/api/opensky/{kind}")
def opensky(kind: str, request: Request, _user_id: int = Depends(get_current_user)):
    try:
        return opensky_query(kind, dict(request.query_params))
    except UpstreamError as e:
        return error(e.message, e.status)


# Exchange rates, cached on the server. Public: it holds nothing private.
@app.get("/api/rates")
def rates():
    try:
        return get_rates()
    except UpstreamError as e:
        return error(e.message, e.status)



ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I/L look-alikes
INVITEE_ROLES = ("picker-upper", "driver")
FLIGHT_NO = re.compile(r"^([A-Z0-9]{2})(\d{1,4}[A-Z]?)$")
TRIP_ID = re.compile(r"^(\d+)-([A-Z0-9]{3,7})-(\d{4}-\d{2}-\d{2})$")


def ensure_schema():
    """Adds the columns trip linking needs. Safe to run every start-up (also in db/trip_linking.sql)."""
    try:
        with psycopg.connect(os.environ["DATABASE_URL"]) as db:
            db.execute(
                """ALTER TABLE invites
                     ADD COLUMN IF NOT EXISTS flight_number varchar,
                     ADD COLUMN IF NOT EXISTS flight_date date,
                     ADD COLUMN IF NOT EXISTS origin varchar(3),
                     ADD COLUMN IF NOT EXISTS destination varchar(3),
                     ADD COLUMN IF NOT EXISTS role varchar"""
            )
            db.execute("ALTER TABLE linked_trip_data ALTER COLUMN created_at SET DEFAULT now()")
            # receiver_id NULL means "everyone on the trip", so the column must allow NULL
            db.execute("ALTER TABLE linked_trip_data ALTER COLUMN receiver_id DROP NOT NULL")
            db.commit()
    except Exception as e:  # don't stop the server; the routes will say what is missing
        print("ensure_schema failed:", e)


def parse_flight(raw):
    """' ba 65 ' -> 'BA 65', or None if it isn't an airline code + number."""
    match = FLIGHT_NO.match(re.sub(r"\s+", "", raw or "").upper())
    return f"{match[1]} {match[2]}" if match else None


def trip_id_of(creator_id, flight_number, flight_date):
    return f"{creator_id}-{flight_number.replace(' ', '')}-{flight_date}"


class InviteBody(BaseModel):
    flight_number: str
    flight_date: str
    origin: str | None = None
    destination: str | None = None
    role: str


class RedeemBody(BaseModel):
    invite_code: str


class PayloadBody(BaseModel):
    type: str                       # "status" or "location"
    status: str | None = None       # status: "landed" | "out"
    kind: str | None = None         # location: "flight" | "personal"
    lat: float | None = None
    lon: float | None = None
    accuracy_m: float | None = None
    heading: float | None = None
    altitude_ft: float | None = None
    source: str | None = None       # flight location: "opensky" | "last-seen" | "airport"
    hidden: bool | None = None      # flight_visibility: True = hide the plane from the others


def airport_or_none(value):
    return value.upper() if value and IATA.match(value) else None


@app.post("/api/invites", status_code=201)
def create_invite(
    body: InviteBody,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db),
):
    flight = parse_flight(body.flight_number)
    if not flight:
        raise HTTPException(400, "Flight number should be an airline code followed by digits, e.g. BA 65")
    if not valid_date(body.flight_date):
        raise HTTPException(400, "The flight date must look like YYYY-MM-DD")
    if body.role not in INVITEE_ROLES:
        raise HTTPException(400, "Invite a picker-upper or a driver")

    code = "".join(secrets.choice(ALPHABET) for _ in range(8))
    row = db.execute(
        """INSERT INTO invites (code, creator_id, expires_at, flight_number, flight_date,
                                origin, destination, role)
           VALUES (%s, %s, now() + interval '15 minutes', %s, %s, %s, %s, %s)
           RETURNING expires_at::timestamptz AS expires_at""",
        (
            code, user_id, flight, body.flight_date,
            airport_or_none(body.origin), airport_or_none(body.destination), body.role,
        ),
    ).fetchone()
    db.commit()
    return {
        "code": code,
        "expires_at": row["expires_at"].isoformat(),
        "trip_id": trip_id_of(user_id, flight, body.flight_date),
    }


@app.post("/api/invites/redeem")
def redeem_invite(
    body: RedeemBody,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db),
):
    code = body.invite_code.strip().upper()

    # One atomic statement: checks and claim together, so two people
    # can't both redeem the same code.
    row = db.execute(
        """UPDATE invites
           SET used_by = %s, used_at = now()
           WHERE code = %s
             AND used_by IS NULL
             AND expires_at > now()
             AND creator_id <> %s
             AND flight_number IS NOT NULL
           RETURNING creator_id, flight_number, flight_date, role""",
        (user_id, code, user_id),
    ).fetchone()
    db.commit()

    if row is None:
        raise HTTPException(400, "Invalid, expired, or already used code")

    return {
        "code": code,
        "partner_id": row["creator_id"],
        "role": row["role"],
        "trip_id": trip_id_of(row["creator_id"], row["flight_number"], row["flight_date"]),
    }


def load_trips(db, me):
    """Every trip `me` is on (as the traveller or as someone who joined), ready for the UI."""
    mine = db.execute(
        """SELECT DISTINCT creator_id, flight_number, flight_date FROM invites
           WHERE flight_number IS NOT NULL AND (creator_id = %s OR used_by = %s)""",
        (me, me),
    ).fetchall()
    if not mine:
        return []
    wanted = {(r["creator_id"], r["flight_number"], r["flight_date"]) for r in mine}

    invites = db.execute(
        """SELECT i.code, i.creator_id, i.flight_number, i.flight_date, i.origin, i.destination,
                  i.role, i.used_by, i.used_at::timestamptz AS used_at,
                  i.expires_at::timestamptz AS expires_at, (i.expires_at > now()) AS active,
                  cu.full_name AS creator_name, uu.full_name AS used_name
           FROM invites i
           JOIN users cu ON cu.id = i.creator_id
           LEFT JOIN users uu ON uu.id = i.used_by
           WHERE i.creator_id = ANY(%s) AND i.flight_number IS NOT NULL
           ORDER BY i.expires_at""",
        (list({k[0] for k in wanted}),),
    ).fetchall()

    grouped = {}  # (creator, flight, date) -> invites, oldest first
    for inv in invites:
        key = (inv["creator_id"], inv["flight_number"], inv["flight_date"])
        if key in wanted:
            grouped.setdefault(key, []).append(inv)

    code_to_key = {inv["code"]: key for key, group in grouped.items() for inv in group}
    payloads = db.execute(
        """SELECT d.invite_code, d.sender_id, d.payload, d.created_at::timestamptz AS created_at,
                  u.full_name AS sender_name
           FROM linked_trip_data d JOIN users u ON u.id = d.sender_id
           WHERE d.invite_code = ANY(%s) ORDER BY d.id""",
        (list(code_to_key),),
    ).fetchall()

    by_trip = {}
    for p in payloads:
        by_trip.setdefault(code_to_key[p["invite_code"]], []).append(p)

    trips = []
    for key, group in grouped.items():
        creator_id, flight, date = key
        creator_name = group[0]["creator_name"]
        latest = group[-1]

        # who is on the trip
        people = [{
            "user_id": creator_id, "name": creator_name, "role": "traveller",
            "status": "you" if creator_id == me else "linked", "joined_at": None,
        }]
        joined = {}
        for inv in group:
            if inv["used_by"] is not None:
                joined[inv["used_by"]] = inv
        for uid, inv in joined.items():
            people.append({
                "user_id": uid, "name": inv["used_name"], "role": inv["role"],
                "status": "you" if uid == me else "linked", "joined_at": inv["used_at"].isoformat(),
            })
        for role in INVITEE_ROLES:
            if not any(p["role"] == role for p in people):
                waiting = [i for i in group if i["role"] == role and i["used_by"] is None and i["active"]]
                if waiting:
                    people.append({
                        "user_id": None, "name": None, "role": role,
                        "status": "pending", "joined_at": None,
                    })

        # status + shared locations
        landed_at = out_at = None
        flight_hidden = False  # the traveller's newest choice wins (rows are in id order)
        shared = {}  # (sender, kind) -> newest location
        for p in by_trip.get(key, []):
            data = p["payload"]
            if data.get("type") == "flight_visibility":
                if p["sender_id"] == creator_id:
                    flight_hidden = bool(data.get("hidden"))
            elif data.get("type") == "status":
                if data.get("status") == "landed" and not landed_at:
                    landed_at = p["created_at"].isoformat()
                if data.get("status") == "out" and not out_at:
                    out_at = p["created_at"].isoformat()
            elif data.get("type") == "location":
                shared[(p["sender_id"], data.get("kind"))] = {
                    **data,
                    "sender_id": p["sender_id"],
                    "sender_name": p["sender_name"],
                    "mine": p["sender_id"] == me,
                    "at": p["created_at"].isoformat(),
                }

        # Hiding only lasts until the flight has landed; after that people share on purpose.
        flight_hidden = flight_hidden and not landed_at
        if flight_hidden and creator_id != me:
            shared = {k: v for k, v in shared.items() if v.get("kind") != "flight"}

        my_role = "traveller" if creator_id == me else joined[me]["role"]
        invite = None
        if creator_id == me:  # only the traveller sees (and can renew) codes
            invite = {
                "code": latest["code"], "role": latest["role"],
                "expires_at": latest["expires_at"].isoformat(),
                "used": latest["used_by"] is not None,
                "used_by_name": latest["used_name"],
                "active": bool(latest["active"]) and latest["used_by"] is None,
            }

        trips.append({
            "id": trip_id_of(creator_id, flight, date),
            "flight_number": flight, "date": str(date),
            "origin": latest["origin"], "destination": latest["destination"],
            "role": my_role,
            "traveller": {"id": creator_id, "name": creator_name},
            "people": people, "invite": invite,
            "landed_at": landed_at, "out_at": out_at,
            "flight_hidden": flight_hidden,
            "shared": list(shared.values()),
            "_sort": latest["expires_at"],
        })

    trips.sort(key=lambda t: t["_sort"], reverse=True)
    for t in trips:
        del t["_sort"]
    return trips


@app.get("/api/trips")
def list_trips(user_id: int = Depends(get_current_user), db=Depends(get_db)):
    return load_trips(db, user_id)


def find_my_link(db, me, trip_id):
    """-> (all codes for the trip, the code that links `me` to it). 404 if `me` isn't on the trip."""
    match = TRIP_ID.match(trip_id)
    rows = []
    if match:
        creator_id, flight, date = int(match[1]), match[2], match[3]
        rows = db.execute(
            """SELECT code, used_by FROM invites
               WHERE creator_id = %s AND replace(flight_number, ' ', '') = %s AND flight_date = %s
               ORDER BY expires_at""",
            (creator_id, flight, date),
        ).fetchall()
    if not rows:
        raise HTTPException(404, "Trip not found")

    codes = [r["code"] for r in rows]
    if creator_id == me:
        return codes, codes[-1]
    mine = [r["code"] for r in rows if r["used_by"] == me]
    if not mine:
        raise HTTPException(404, "Trip not found")
    return codes, mine[0]


@app.post("/api/trips/{trip_id}/payload", status_code=201)
def send_payload(
    trip_id: str,
    body: PayloadBody,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db),
):
    codes, my_code = find_my_link(db, user_id, trip_id)
    is_traveller = trip_id.startswith(f"{user_id}-")

    if body.type == "status":
        if body.status not in ("landed", "out"):
            raise HTTPException(400, "status must be 'landed' or 'out'")
        if body.status == "out" and not is_traveller:
            raise HTTPException(403, "Only the traveller can say they are out")
        payload = {"type": "status", "status": body.status}

        # "landed" / "out" only need to be said once for the whole trip
        already = db.execute(
            """SELECT 1 FROM linked_trip_data
               WHERE invite_code = ANY(%s) AND payload->>'type' = 'status' AND payload->>'status' = %s
               LIMIT 1""",
            (codes, body.status),
        ).fetchone()
        if already:
            return {"ok": True, "duplicate": True}

    elif body.type == "flight_visibility":
        if not is_traveller:
            raise HTTPException(403, "Only the traveller can hide or show the flight")
        if body.hidden is None:
            raise HTTPException(400, "hidden must be true or false")
        payload = {"type": "flight_visibility", "hidden": body.hidden}

    elif body.type == "location":
        if body.kind not in ("flight", "personal"):
            raise HTTPException(400, "kind must be 'flight' or 'personal'")
        if body.lat is None or body.lon is None or not (-90 <= body.lat <= 90 and -180 <= body.lon <= 180):
            raise HTTPException(400, "lat and lon must be real coordinates")
        payload = {
            "type": "location", "kind": body.kind, "lat": body.lat, "lon": body.lon,
            "accuracy_m": body.accuracy_m, "heading": body.heading,
            "altitude_ft": body.altitude_ft, "source": body.source,
        }
    else:
        raise HTTPException(400, "type must be 'status', 'location' or 'flight_visibility'")

    db.execute(
        """INSERT INTO linked_trip_data (invite_code, receiver_id, sender_id, payload, created_at)
           VALUES (%s, NULL, %s, %s, now())""",
        (my_code, user_id, Json(payload)),
    )
    db.commit()
    return {"ok": True}


@app.delete("/api/trips/{trip_id}/location/{kind}")
def stop_sharing(
    trip_id: str,
    kind: str,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db),
):
    if kind not in ("flight", "personal"):
        raise HTTPException(400, "kind must be 'flight' or 'personal'")
    codes, _ = find_my_link(db, user_id, trip_id)
    db.execute(
        """DELETE FROM linked_trip_data
           WHERE sender_id = %s AND invite_code = ANY(%s)
             AND payload->>'type' = 'location' AND payload->>'kind' = %s""",
        (user_id, codes, kind),
    )
    db.commit()
    return {"ok": True}


# ---------- saved flights ----------
#
# POST   /api/saved-flights          save a flight (saving the same flight again does nothing new)
# GET    /api/saved-flights          everything I've saved, newest first
# DELETE /api/saved-flights/{key}    un-save
#
# Only the tables in the schema are used: `flights` is one saved trip (origin/destination/
# times are the OUTBOUND part, price is the whole trip) and `flight_segments` holds every leg
# in order. A round trip is one `flights` row whose segments are the outbound legs followed
# by the return legs; the return starts at the first later segment that leaves from the
# outbound destination.
#
# There is no flight_key column. A flight's "key" is worked out from its segments (airport +
# departure time of each leg, then the final airport). src/api/flights.js builds the same
# string for search results, which is how the UI knows a search result is already saved.

STAMP = "%Y-%m-%d %H:%M"


def parse_stamp(value):
    """'2026-11-21 18:00' -> datetime, or None if it's missing or malformed."""
    try:
        return datetime.strptime(value, STAMP)
    except (TypeError, ValueError):
        return None


def stamp_text(dt):
    return dt.strftime(STAMP) if dt else ""


def flight_key(legs):
    """legs: [(origin, departure datetime or None, destination), ...] in order.
    Keep in sync with flightKey() in src/api/flights.js."""
    parts = [f"{origin}{stamp_text(dep)}" for origin, dep, _ in legs] + [legs[-1][2]]
    return re.sub(r"[^A-Za-z0-9]+", "-", "-".join(parts))[:190]


class SegmentBody(BaseModel):
    origin: str
    destination: str
    origin_name: str | None = None
    destination_name: str | None = None
    departure: str | None = None
    arrival: str | None = None
    airline: str | None = None
    flight_number: str | None = None
    aircraft: str | None = None


class SaveFlightBody(BaseModel):
    origin: str
    destination: str
    departure: str | None = None
    arrival: str | None = None
    price: int | None = None
    currency: str | None = None
    segments: list[SegmentBody] = []


def saved_flights_of(db, user_id):
    """The user's saved flights, newest first, each with its segments (and airport names)."""
    rows = db.execute(
        """SELECT f.id, f.origin, f.destination, f.price, f.currency,
                  s.origin AS seg_origin, s.destination AS seg_destination,
                  s.departure, s.arrival, s.airline, s.flight_number, s.aircraft,
                  ao.airport_name AS origin_name, ad.airport_name AS destination_name
           FROM flights f
           JOIN flight_segments s ON s.flight_id = f.id
           LEFT JOIN airports ao ON ao.airport_code = s.origin
           LEFT JOIN airports ad ON ad.airport_code = s.destination
           WHERE f.traveller_id = %s
           ORDER BY f.id DESC, s.position""",
        (user_id,),
    ).fetchall()

    flights = {}  # dict keeps insertion order, so newest stays first
    for r in rows:
        f = flights.setdefault(
            r["id"],
            {
                "db_id": r["id"], "origin": r["origin"], "destination": r["destination"],
                "price": r["price"], "currency": r["currency"], "segments": [],
            },
        )
        f["segments"].append(
            {
                "origin": r["seg_origin"], "destination": r["seg_destination"],
                "origin_name": r["origin_name"], "destination_name": r["destination_name"],
                "departure": stamp_text(r["departure"]) or None,
                "arrival": stamp_text(r["arrival"]) or None,
                "airline": r["airline"], "flight_number": r["flight_number"], "aircraft": r["aircraft"],
            }
        )

    result = []
    for f in flights.values():
        f["id"] = flight_key(
            [(s["origin"], parse_stamp(s["departure"]), s["destination"]) for s in f["segments"]]
        )
        result.append(f)
    return result


@app.post("/api/saved-flights", status_code=201)
def save_flight(
    body: SaveFlightBody,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db),
):
    if not (IATA.match(body.origin) and IATA.match(body.destination)):
        raise HTTPException(400, "origin and destination must be 3-letter airport codes")
    if not body.segments or len(body.segments) > 12:
        raise HTTPException(400, "a flight needs between 1 and 12 segments")
    if any(not (IATA.match(s.origin) and IATA.match(s.destination)) for s in body.segments):
        raise HTTPException(400, "segment airports must be 3-letter codes")

    currency = body.currency[:3].upper() if body.currency else None
    key = flight_key(
        [(s.origin.upper(), parse_stamp(s.departure), s.destination.upper()) for s in body.segments]
    )

    try:
        # one save at a time per person, so a double click can't store the same flight twice
        db.execute("SELECT pg_advisory_xact_lock(%s)", (user_id,))

        already = next((f for f in saved_flights_of(db, user_id) if f["id"] == key), None)
        if already:
            db.execute(
                "UPDATE flights SET price = %s, currency = %s WHERE id = %s",
                (body.price, currency, already["db_id"]),
            )
            db.commit()
            return {"id": key}

        # flights and flight_segments point at the airports table, so make sure the codes exist
        airports = {}
        for code, name in [(body.origin, None), (body.destination, None)] + [
            pair
            for s in body.segments
            for pair in ((s.origin, s.origin_name), (s.destination, s.destination_name))
        ]:
            airports[code.upper()] = name or airports.get(code.upper())
        for code, name in airports.items():
            db.execute(
                """INSERT INTO airports (airport_code, airport_name) VALUES (%s, %s)
                   ON CONFLICT (airport_code) DO NOTHING""",
                (code, name or code),
            )

        row = db.execute(
            """INSERT INTO flights (traveller_id, origin, destination, departure, arrival,
                                    price, currency)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (
                user_id, body.origin.upper(), body.destination.upper(),
                parse_stamp(body.departure), parse_stamp(body.arrival),
                body.price, currency,
            ),
        ).fetchone()

        for position, s in enumerate(body.segments):
            db.execute(
                """INSERT INTO flight_segments (flight_id, position, origin, destination,
                                                departure, arrival, airline, flight_number, aircraft)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    row["id"], position, s.origin.upper(), s.destination.upper(),
                    parse_stamp(s.departure), parse_stamp(s.arrival),
                    s.airline, s.flight_number, s.aircraft,
                ),
            )
        db.commit()
    except psycopg.Error as e:
        db.rollback()
        print("Save flight error:", e)
        raise HTTPException(500, "Could not save the flight")

    return {"id": key}


@app.get("/api/saved-flights")
def list_saved_flights(user_id: int = Depends(get_current_user), db=Depends(get_db)):
    return saved_flights_of(db, user_id)


@app.delete("/api/saved-flights/{key}")
def delete_saved_flight(
    key: str,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db),
):
    ids = [f["db_id"] for f in saved_flights_of(db, user_id) if f["id"] == key]
    try:
        for flight_id in ids:
            db.execute("DELETE FROM flight_segments WHERE flight_id = %s", (flight_id,))
            db.execute("DELETE FROM flights WHERE id = %s", (flight_id,))
        db.commit()
    except psycopg.Error as e:
        db.rollback()
        print("Delete saved flight error:", e)
        raise HTTPException(500, "Could not remove the flight")
    return {"ok": True}
