import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { searchFlights } from "../../api/flights.js";
import { providerUrl } from "../../api/airlines.js";
import { formatKes } from "../../utils/currency.js";
import "../styles/anga360.css";

function ScrollReveal({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// "ET 305" if we know the number, otherwise just the airline code ("ET").
const flightLabel = (f) => f.flightNo || f.airlineCode || "";

// 1 when the plane lands the next day (shown as "+1" next to the arrival time).
function dayShift(dep, arr) {
  if (!dep || !arr) return 0;
  const day = (stamp) => Date.parse(`${stamp.slice(0, 10)}T00:00:00Z`);
  return Math.round((day(arr) - day(dep)) / 86400000);
}

// One direction of a flight card: times, duration, stops.
function TripRow({ label, trip }) {
  const [fromCode, toCode] = (trip.route || "").split(" → ");
  const shift = dayShift(trip.depStamp, trip.arrStamp);
  return (
    <div className="trip-row">
      {label && <div className="trip-row-label">{label}</div>}
      <div className="route-row">
        <div>
          <div className="time-big">{trip.departure || trip.segments?.[0]?.depTime || "—"}</div>
          <div className="airport-code">{trip.depCode || fromCode || "—"}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          {trip.duration && <div style={{ fontSize: "12px", color: "#64748b" }}>{trip.duration}</div>}
          <div className="line-bar" />
          <div style={{ fontSize: "12px", color: "#64748b" }}>{trip.stops}</div>
        </div>
        <div>
          <div className="time-big">
            {trip.arrival || trip.segments?.at(-1)?.arrTime || "—"}
            {shift > 0 && <sup className="day-shift">+{shift}</sup>}
          </div>
          <div className="airport-code">{trip.arrCode || toCode || "—"}</div>
        </div>
      </div>
    </div>
  );
}

// The leg-by-leg timeline on the details page, with the layover notes between legs.
function SegmentList({ trip }) {
  const gaps = trip.layoverTexts ?? (trip.layover ? [trip.layover] : []);
  return (
    <div className="segments-wrapper">
      {trip.segments.map((seg, idx) => (
        <div key={idx}>
          <div className="segment-block">
            <div className="airline-chip">{seg.code}</div>

            <div className="segment-timeline">
              <div className="timeline-point">
                <span className="timeline-dot" />
                <span className="seg-time">{seg.depTime}</span>
                <span className="seg-airport-code">{seg.depCode}</span>
                <span className="seg-airport-name">{seg.depAirport}</span>
              </div>

              <div className="timeline-line-row">
                <span className="timeline-vertical-line" />
                <span className="seg-flight-meta">{seg.flightInfo}</span>
              </div>

              <div className="timeline-point">
                <span className="timeline-dot" />
                <span className="seg-time">{seg.arrTime}</span>
                <span className="seg-airport-code">{seg.arrCode}</span>
                <span className="seg-airport-name">{seg.arrAirport}</span>
              </div>

              {seg.tags?.length > 0 && (
                <div className="seg-tags">
                  {seg.tags.map((tag) => (
                    <span key={tag} className="spec-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {idx < trip.segments.length - 1 && gaps[idx] && (
            <div className="layover-banner">{gaps[idx]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// Shown only if someone opens /search without searching from the homepage.
const SAMPLE_FLIGHTS = [
  {
    id: "AN-360",
    airline: "Ethiopian Airlines",
    airlineCode: "ET",
    flightNo: "ET 305",
    route: "NBO → LHR",
    departure: "06:55",
    arrival: "17:20",
    duration: "13h 25m",
    stops: "1 stop",
    price: 83200,
    currency: "KES",
    rating: 4.8,
    aircraft: "Boeing 737-800",
    cabin: "Economy",
    co2Note: "Carbon emissions about 7% lower than typical for this route",
    outboundDate: "Mon 14 Dec 2026",
    returnDate: null,
    tripSummary: "KSh one-way · 1 adult · Economy",
    providerNote:
      "Opens the provider in a new tab. Fetched 13 Nov 2026, 14:32. Prices and availability may change. Anga360 does not sell tickets.",
    segments: [
      {
        code: "ET",
        depTime: "06:55",
        depCode: "NBO",
        depAirport: "Jomo Kenyatta International Airport",
        flightInfo: "Flight time 1h 45m · Ethiopian Airlines ET 305 · Boeing 737-800",
        arrTime: "08:40",
        arrCode: "ADD",
        arrAirport: "Addis Ababa Bole International Airport",
        tags: ["Economy", "Legroom 31 in", "Wi-Fi for a fee"],
      },
      {
        code: "ET",
        depTime: "10:50",
        depCode: "ADD",
        depAirport: "Addis Ababa Bole International Airport",
        flightInfo: "Flight time 8h 30m · Ethiopian Airlines ET 700 · Boeing 787-9",
        arrTime: "17:20",
        arrCode: "LHR",
        arrAirport: "London Heathrow Airport",
        tags: ["Economy", "Legroom 32 in", "In-seat power", "On-demand video"],
      },
    ],
    layover: "Layover · 2h 10m in Addis Ababa (ADD)",
  },
  {
    id: "AN-361",
    airline: "Kenya Airways",
    airlineCode: "KQ",
    flightNo: "KQ 100",
    route: "NBO → LHR",
    departure: "09:15",
    arrival: "16:10",
    duration: "8h 55m",
    stops: "Direct",
    price: 96500,
    currency: "KES",
    rating: 4.7,
    aircraft: "Boeing 787-8",
    cabin: "Economy",
    co2Note: "Carbon emissions about 12% lower than typical for this route",
    outboundDate: "Mon 14 Dec 2026",
    returnDate: null,
    tripSummary: "KSh one-way · 1 adult · Economy",
    providerNote:
      "Opens the provider in a new tab. Fetched 13 Nov 2026, 14:32. Prices and availability may change. Anga360 does not sell tickets.",
    segments: [
      {
        code: "KQ",
        depTime: "09:15",
        depCode: "NBO",
        depAirport: "Jomo Kenyatta International Airport",
        flightInfo: "Flight time 8h 55m · Kenya Airways KQ 100 · Boeing 787-8",
        arrTime: "16:10",
        arrCode: "LHR",
        arrAirport: "London Heathrow Airport",
        tags: ["Economy", "Legroom 32 in", "In-seat power", "On-demand video"],
      },
    ],
    layover: null,
  },
  {
    id: "AN-362",
    airline: "RwandAir",
    airlineCode: "WB",
    flightNo: "WB 451",
    route: "NBO → LHR",
    departure: "11:30",
    arrival: "22:45",
    duration: "13h 15m",
    stops: "1 stop",
    price: 79800,
    currency: "KES",
    rating: 4.6,
    aircraft: "Airbus A330-300",
    cabin: "Economy",
    co2Note: "Carbon emissions typical for this route",
    outboundDate: "Mon 14 Dec 2026",
    returnDate: null,
    tripSummary: "KSh one-way · 1 adult · Economy",
    providerNote:
      "Opens the provider in a new tab. Fetched 13 Nov 2026, 14:32. Prices and availability may change. Anga360 does not sell tickets.",
    segments: [
      {
        code: "WB",
        depTime: "11:30",
        depCode: "NBO",
        depAirport: "Jomo Kenyatta International Airport",
        flightInfo: "Flight time 1h 25m · RwandAir WB 451 · Boeing 737-800",
        arrTime: "11:55",
        arrCode: "KGL",
        arrAirport: "Kigali International Airport",
        tags: ["Economy", "Legroom 31 in", "Snack included"],
      },
      {
        code: "WB",
        depTime: "14:00",
        depCode: "KGL",
        depAirport: "Kigali International Airport",
        flightInfo: "Flight time 9h 45m · RwandAir WB 710 · Airbus A330-300",
        arrTime: "22:45",
        arrCode: "LHR",
        arrAirport: "London Heathrow Airport",
        tags: ["Economy", "Legroom 32 in", "In-seat power", "On-demand video"],
      },
    ],
    layover: "Layover · 2h 05m in Kigali (KGL)",
  },
];

export default function FlightSearchApp({
  activeTab,
  onSwitchTab,
  compareList,
  setCompareList,
  savedFlights,
  onToggleSave,
}) {
  const location = useLocation();
  const query = location.state?.query; // set by the homepage; absent on /details, /compare, ...

  const [flights, setFlights] = useState(SAMPLE_FLIGHTS);
  const [route, setRoute] = useState({ from: "NBO", to: "LHR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [maxPrice, setMaxPrice] = useState(120000);
  const [selectedAirlines, setSelectedAirlines] = useState([
    "Ethiopian Airlines",
    "Kenya Airways",
    "RwandAir",
  ]);
  const [selectedFlight, setSelectedFlight] = useState(SAMPLE_FLIGHTS[0]);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    searchFlights(query)
      .then((results) => {
        if (cancelled) return;
        setFlights(results);
        setRoute({ from: query.origin, to: query.destination });
        setSelectedAirlines([...new Set(results.map((fl) => fl.airline))]);
        setMaxPrice(Math.max(0, ...results.map((fl) => fl.price)));
        setSelectedFlight(results[0] ?? null);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query]);

  const airlines = [...new Set(flights.map((fl) => fl.airline))];
  const prices = flights.map((fl) => fl.price);
  const priceCeil = Math.max(1000, ...prices);
  const priceFloor = Math.min(priceCeil, ...(prices.length ? prices : [0]));
  const priceStep = Math.max(1, Math.round((priceCeil - priceFloor) / 50));

  const toggleAirline = (airline) => {
    setSelectedAirlines((prev) =>
      prev.includes(airline) ? prev.filter((a) => a !== airline) : [...prev, airline]
    );
  };

  const toggleCompare = (flight) => {
    setCompareList((prev) => {
      if (prev.some((f) => f.id === flight.id)) {
        return prev.filter((f) => f.id !== flight.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, flight];
    });
  };

  const handleToggleSave = async (flight) => {
    setSaveError("");
    const result = await onToggleSave(flight);
    if (!result.ok) setSaveError(result.message);
  };

  const openDetailsPage = (flight) => {
    setSelectedFlight(flight);
    onSwitchTab("details");
  };

  const filteredFlights = flights.filter(
    (f) => f.price <= maxPrice && selectedAirlines.includes(f.airline)
  );

  const isSaved = selectedFlight && savedFlights.some((f) => f.id === selectedFlight.id);

  return (
    <main className="container">
      {/* FLIGHT DETAILS VIEW */}
      {activeTab === "details" && selectedFlight && (
        <div className="details-page">
          <button className="back-link" onClick={() => onSwitchTab("search")}>
            ← Back to results
          </button>

          <div className="details-grid">
            <div className="details-main">
              <section className="card details-card">
                <div className="details-card-header">
                  <h2>{selectedFlight.roundTrip ? "Outbound" : "Flight"} · {selectedFlight.outboundDate}</h2>
                  <span className="details-meta">
                    {[selectedFlight.duration && `Total ${selectedFlight.duration}`, selectedFlight.stops]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>

                <SegmentList trip={selectedFlight} />
              </section>

              {selectedFlight.inbound ? (
                <section className="card details-card">
                  <div className="details-card-header">
                    <h2>Return · {selectedFlight.inbound.date}</h2>
                    <span className="details-meta">
                      {[
                        selectedFlight.inbound.duration && `Total ${selectedFlight.inbound.duration}`,
                        selectedFlight.inbound.stops,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <SegmentList trip={selectedFlight.inbound} />
                </section>
              ) : (
                selectedFlight.roundTrip && (
                  <section className="card return-card">
                    <div>
                      <h3>Return · {selectedFlight.returnDate}</h3>
                      <p>
                        No return flights were found for this date. Try the Google Flights link
                        for other options.
                      </p>
                    </div>
                  </section>
                )
              )}
            </div>

            <aside className="card summary-card">
              <span className="summary-label">Total price</span>
              <div className="summary-price">
                {formatKes(selectedFlight.price)}
              </div>
              <p className="summary-sub">{selectedFlight.tripSummary}</p>

              {selectedFlight.co2Note && (
                <div className="emissions-banner">{selectedFlight.co2Note}</div>
              )}

              <div className="provider-info">
                <span className="provider-label">Booking provider</span>
                <strong className="provider-name">{selectedFlight.airline}</strong>
              </div>

              <button
                className="btn btn-primary btn-full"
                disabled={!providerUrl(selectedFlight)}
                onClick={() =>
                  window.open(providerUrl(selectedFlight), "_blank", "noopener,noreferrer")
                }
              >
                Continue to provider
              </button>

              {selectedFlight.bookingUrl && (
                <a
                  className="btn btn-outline-blue btn-full"
                  href={selectedFlight.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textAlign: "center", textDecoration: "none" }}
                >
                  See this search on Google Flights
                </a>
              )}

              <button
                className="btn btn-outline-blue btn-full"
                onClick={() => handleToggleSave(selectedFlight)}
              >
                {isSaved ? "Saved ✓" : "Save flight"}
              </button>
              {saveError && (
                <p role="alert" style={{ color: "#c0392b", fontSize: "13px" }}>
                  {saveError}
                </p>
              )}

              <p className="provider-disclaimer">{selectedFlight.providerNote}</p>
            </aside>
          </div>
        </div>
      )}

      {/* SEARCH RESULTS VIEW */}
      {activeTab === "search" && (
        <>
          <ScrollReveal>
            <section className="hero-banner">
              <div>
                <h1>{route.from} to {route.to}</h1>
                <p>Compare fares, inspect aircraft specs, and book seamlessly.</p>
              </div>
              <button className="btn btn-secondary" onClick={() => onSwitchTab("compare")}>
                Compare Matrix ({compareList.length}/3)
              </button>
            </section>
          </ScrollReveal>

          <div className="search-layout">
            <ScrollReveal delay={80}>
              <aside className="card sidebar">
                <h3 style={{ marginBottom: "16px", color: "#0f2a56" }}>Filters</h3>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Max Price: {formatKes(maxPrice)}
                  </label>
                  <input
                    type="range"
                    min={priceFloor}
                    max={priceCeil}
                    step={priceStep}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#1d63dc" }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Airlines
                  </span>
                  {airlines.map((airline) => (
                    <label key={airline} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(airline)}
                        onChange={() => toggleAirline(airline)}
                      />
                      <span>{airline}</span>
                    </label>
                  ))}
                </div>
              </aside>
            </ScrollReveal>

            <div className="flight-list">
              {loading && (
                <div className="ag-skel-list" role="status" aria-live="polite">
                  <p className="ag-skel-note">
                    Tunatafuta ndege bora… <span>Searching flights</span>
                  </p>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="ag-skel-card">
                      <div>
                        <div className="ag-skel ag-skel--line ag-skel--mid" />
                        <div className="ag-skel ag-skel--line" />
                        <div className="ag-skel ag-skel--line ag-skel--short" />
                      </div>
                      <div className="ag-skel ag-skel--price" />
                    </div>
                  ))}
                </div>
              )}
              {error && <section className="card" style={{ color: "#c0392b" }}>{error}</section>}
              {!loading && !error && filteredFlights.length === 0 && (
                <section className="card ag-empty">
                  <h3>No flights match these filters</h3>
                  <p>Pole! Try raising the price limit or clearing the airline filter.</p>
                </section>
              )}
              {filteredFlights.map((flight, idx) => {
                const isComparing = compareList.some((f) => f.id === flight.id);
                return (
                  <ScrollReveal key={flight.id} delay={110 * (idx + 1)}>
                    <article className="card flight-card">
                      <div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <strong>{flight.airline}</strong>
                          {flightLabel(flight) && <span className="badge">{flightLabel(flight)}</span>}
                          {flight.rating && <span className="badge badge-rating">{flight.rating} ★</span>}
                        </div>
                        <TripRow
                          label={flight.inbound ? `Outbound · ${flight.outboundDate}` : null}
                          trip={flight}
                        />
                        {flight.inbound && (
                          <TripRow
                            label={`Return · ${flight.inbound.date}${
                              flight.inbound.airline && flight.inbound.airline !== flight.airline
                                ? " · " + flight.inbound.airline
                                : ""
                            }`}
                            trip={flight.inbound}
                          />
                        )}
                        {flight.roundTrip && !flight.inbound && (
                          <p className="trip-row-note">No return flights found for {flight.returnDate}.</p>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="price-amount">
                          {formatKes(flight.price)}
                        </div>
                        {flight.roundTrip && <div className="price-caption">round trip</div>}
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                          <button
                            className={`btn ${isComparing ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => toggleCompare(flight)}
                          >
                            {isComparing ? "Comparing ✓" : "Compare"}
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => openDetailsPage(flight)}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* COMPARE VIEW */}
      {activeTab === "compare" && (
        <ScrollReveal>
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Flight Comparison Matrix</h2>
              <button className="btn btn-secondary" onClick={() => onSwitchTab("search")}>
                ← Back to Search
              </button>
            </div>
            {compareList.length === 0 ? (
              <p style={{ color: "#64748b", marginTop: "16px" }}>
                Select up to 3 flights from Search results to compare them side by side.
              </p>
            ) : (
              <div className="compare-grid">
                {compareList.map((f) => (
                  <div key={f.id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>
                        {f.airline}
                        {flightLabel(f) && ` (${flightLabel(f)})`}
                      </strong>
                      <button
                        onClick={() => toggleCompare(f)}
                        style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ marginTop: "12px" }}>
                      <div className="spec-row">
                        <span>Price</span>
                        <strong>
                          {formatKes(f.price)}
                        </strong>
                      </div>
                      <div className="spec-row">
                        <span>Departure</span>
                        <span>{f.departure}</span>
                      </div>
                      <div className="spec-row">
                        <span>Duration</span>
                        <span>{f.duration ?? "—"}</span>
                      </div>
                      <div className="spec-row">
                        <span>Stops</span>
                        <span>{f.stops}</span>
                      </div>
                      <div className="spec-row">
                        <span>Aircraft</span>
                        <span>{f.aircraft ?? "—"}</span>
                      </div>
                      {f.inbound && (
                        <div className="spec-row">
                          <span>Return</span>
                          <span>
                            {f.inbound.departure} → {f.inbound.arrival} · {f.inbound.stops}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: "100%", marginTop: "14px" }}
                      onClick={() => openDetailsPage(f)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </ScrollReveal>
      )}

      {/* SAVED FLIGHTS VIEW */}
      {activeTab === "saved" && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>Saved Flights</h2>
            <button className="btn btn-secondary" onClick={() => onSwitchTab("search")}>
              ← Back to Search
            </button>
          </div>
          {saveError && (
            <p role="alert" style={{ color: "#c0392b", marginBottom: "12px" }}>{saveError}</p>
          )}
          {savedFlights.length === 0 ? (
            <div className="ag-empty">
              <h3>Hakuna ndege zilizohifadhiwa</h3>
              <p>No saved flights yet. Click "Save flight" on any flight details page.</p>
            </div>
          ) : (
            <div className="flight-list">
              {savedFlights
                .map((flight) => (
                <div key={flight.id} className="card flight-card">
                  <div>
                    <strong>
                      {[flight.airline, flightLabel(flight)].filter(Boolean).join(" · ")}
                    </strong>
                    <p style={{ fontSize: "13px", color: "#64748b" }}>
                      {flight.route} · {flight.outboundDate} · {flight.departure} – {flight.arrival}
                      {flight.duration && ` (${flight.duration})`}
                      {flight.inbound && ` · Return ${flight.inbound.date}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <strong>
                      {formatKes(flight.price)}
                    </strong>
                    <button className="btn btn-primary" onClick={() => openDetailsPage(flight)}>
                      Open Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* LINKED TRIPS VIEW */}
      {activeTab === "trips" && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2>Linked Trips</h2>
            <button className="btn btn-secondary" onClick={() => onSwitchTab("search")}>
              ← Back to Search
            </button>
          </div>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Log in to sync your upcoming itineraries and group trip boards.
          </p>
        </section>
      )}
    </main>
  );
}