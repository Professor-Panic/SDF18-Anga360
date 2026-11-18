"""Free fallback source: the open-source fast-flights library (scrapes Google Flights).

It returns a different shape from SerpApi, so to_serp_shape() converts it. That way
src/api/flights.js (mapSerpFlights) works unchanged no matter which source answered.

What fast-flights does NOT give us:
  - flight numbers and per-leg airline (we use the itinerary's first airline for every leg;
    the UI shows the airline code, e.g. "ET", instead of a number)
  - total duration and layover lengths. The frontend works these out itself: each leg has its
    own duration, and a layover is (next departure - last arrival) at the SAME airport, so
    both times are in that airport's local time and no time-zone maths is needed.

Round trips: Google's round-trip search lists OUTBOUND options only, priced as the whole
round trip. So for a round trip we also run a one-way search for the way back and send those
options as "return_flights"; the frontend pairs one with each outbound so a card shows both.
"""
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote

from fast_flights import FlightQuery, FlightsNotFound, Passengers, create_query, get_flights

SEAT = {"economy": "economy", "premium": "premium-economy", "business": "business", "first": "first"}


def _stamp(dt):
    (y, m, d), (hh, mm) = dt.date, dt.time
    return f"{y:04d}-{m:02d}-{d:02d} {hh:02d}:{mm:02d}"


def booking_url(query, origin, destination, outbound_date, return_date, currency):
    """Link to this search on Google Flights, where the person picks the exact flight and
    is sent on to the airline or a booking site. fast-flights has no per-airline booking
    links, so this is the closest we can get."""
    try:  # newer fast-flights versions can build the exact search URL themselves
        url = query.url()
        if isinstance(url, str) and url.startswith("http"):
            return url
    except Exception:
        pass
    text = f"Flights from {origin} to {destination} on {outbound_date}"
    if return_date:
        text += f" through {return_date}"
    return f"https://www.google.com/travel/flights?q={quote(text)}&curr={currency}"


def to_serp_shape(results, currency):
    options = []
    for r in results:
        legs = [
            {
                "departure_airport": {"name": f.from_airport.name, "id": f.from_airport.code, "time": _stamp(f.departure)},
                "arrival_airport": {"name": f.to_airport.name, "id": f.to_airport.code, "time": _stamp(f.arrival)},
                "duration": f.duration,
                "airplane": f.plane_type,
                "airline": r.airlines[0] if r.airlines else "Unknown",
            }
            for f in r.flights
        ]
        typical = r.carbon.typical_on_route
        diff = round((r.carbon.emission - typical) / typical * 100) if typical else None
        options.append(
            {
                "flights": legs,
                "layovers": [
                    {"name": l["arrival_airport"]["name"], "id": l["arrival_airport"]["id"], "duration": None}
                    for l in legs[:-1]
                ],
                "total_duration": None,
                "carbon_emissions": {"difference_percent": diff},
                "price": r.price,
            }
        )
    return {
        "search_parameters": {"currency": currency},
        "best_flights": [],
        "other_flights": options,
        "source": "fast-flights",
    }


def _run(query):
    try:
        return get_flights(query)
    except FlightsNotFound:
        return []


def search(origin, destination, outbound_date, return_date=None, cabin="economy", currency="USD"):
    o, d = origin.upper(), destination.upper()
    seat = SEAT.get(cabin, "economy")
    passengers = Passengers(adults=1)

    legs = [FlightQuery(date=outbound_date, from_airport=o, to_airport=d)]
    if return_date:  # round trips need a second FlightQuery for the way back
        legs.append(FlightQuery(date=return_date, from_airport=d, to_airport=o))

    query = create_query(
        flights=legs,
        seat=seat,
        trip="round-trip" if return_date else "one-way",
        passengers=passengers,
        currency=currency,
    )

    if not return_date:
        data = to_serp_shape(_run(query), currency)
    else:
        # the way back: a plain one-way search, run at the same time as the main one
        back_query = create_query(
            flights=[FlightQuery(date=return_date, from_airport=d, to_airport=o)],
            seat=seat,
            trip="one-way",
            passengers=passengers,
            currency=currency,
        )
        with ThreadPoolExecutor(max_workers=2) as pool:
            out_job = pool.submit(_run, query)
            back_job = pool.submit(_run, back_query)
            results = out_job.result()  # an outbound failure fails the whole search
            try:
                back = back_job.result()
            except Exception as e:  # the outbound flights are still worth showing
                print("Return-leg search error:", e)
                back = []
        data = to_serp_shape(results, currency)
        data["return_flights"] = to_serp_shape(back, currency)["other_flights"]

    data["booking_url"] = booking_url(query, o, d, outbound_date, return_date, currency)
    return data
