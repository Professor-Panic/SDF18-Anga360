import { useEffect, useRef, useState } from "react";
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

const FLIGHTS_DATA = [
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
    returnDate: "Mon 28 Dec 2026",
    tripSummary: "KES round-trip · 1 adult · Economy",
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
    returnDate: "Mon 28 Dec 2026",
    tripSummary: "KES round-trip · 1 adult · Economy",
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
    returnDate: "Mon 28 Dec 2026",
    tripSummary: "KES round-trip · 1 adult · Economy",
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
  savedIds,
  setSavedIds,
}) {
  const [maxPrice, setMaxPrice] = useState(120000);
  const [selectedAirlines, setSelectedAirlines] = useState([
    "Ethiopian Airlines",
    "Kenya Airways",
    "RwandAir",
  ]);
  const [selectedFlight, setSelectedFlight] = useState(FLIGHTS_DATA[0]);
  const [showReturnOptions, setShowReturnOptions] = useState(false);

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

  const toggleSaveFlight = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openDetailsPage = (flight) => {
    setSelectedFlight(flight);
    setShowReturnOptions(false);
    onSwitchTab("details");
  };

  const filteredFlights = FLIGHTS_DATA.filter(
    (f) => f.price <= maxPrice && selectedAirlines.includes(f.airline)
  );

  const isSaved = selectedFlight && savedIds.includes(selectedFlight.id);

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
                  <h2>Outbound · {selectedFlight.outboundDate}</h2>
                  <span className="details-meta">
                    Total {selectedFlight.duration} · {selectedFlight.stops}
                  </span>
                </div>

                <div className="segments-wrapper">
                  {selectedFlight.segments.map((seg, idx) => (
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

                          <div className="seg-tags">
                            {seg.tags.map((tag) => (
                              <span key={tag} className="spec-pill">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {idx === 0 && selectedFlight.layover && (
                        <div className="layover-banner">{selectedFlight.layover}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="card return-card">
                <div>
                  <h3>Return · {selectedFlight.returnDate}</h3>
                  <p>
                    {showReturnOptions
                      ? "Return flight options loaded for Mon 28 Dec 2026."
                      : "Return options are loaded after you pick this outbound flight."}
                  </p>
                </div>
                <button
                  className="btn btn-outline-blue"
                  onClick={() => setShowReturnOptions((prev) => !prev)}
                >
                  {showReturnOptions ? "Hide return flights" : "Show return flights"}
                </button>
              </section>
            </div>

            <aside className="card summary-card">
              <span className="summary-label">Total price</span>
              <div className="summary-price">
                {selectedFlight.currency} {selectedFlight.price.toLocaleString()}
              </div>
              <p className="summary-sub">{selectedFlight.tripSummary}</p>

              <div className="emissions-banner">{selectedFlight.co2Note}</div>

              <div className="provider-info">
                <span className="provider-label">Booking provider</span>
                <strong className="provider-name">{selectedFlight.airline}</strong>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() =>
                  window.open("https://www.ethiopianairlines.com", "_blank", "noopener,noreferrer")
                }
              >
                Continue to provider
              </button>

              <button
                className="btn btn-outline-blue btn-full"
                onClick={() => toggleSaveFlight(selectedFlight.id)}
              >
                {isSaved ? "Saved ✓" : "Save flight"}
              </button>

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
                <h1>Nairobi (NBO) to London (LHR)</h1>
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
                    Max Price: KES {maxPrice.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="60000"
                    max="120000"
                    step="2000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#1d63dc" }}
                  />
                </div>

                <div>
                  <span style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Airlines
                  </span>
                  {["Ethiopian Airlines", "Kenya Airways", "RwandAir"].map((airline) => (
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
              {filteredFlights.map((flight, idx) => {
                const isComparing = compareList.some((f) => f.id === flight.id);
                return (
                  <ScrollReveal key={flight.id} delay={110 * (idx + 1)}>
                    <article className="card flight-card">
                      <div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <strong>{flight.airline}</strong>
                          <span className="badge">{flight.flightNo}</span>
                          <span className="badge badge-rating">{flight.rating} ★</span>
                        </div>
                        <div className="route-row">
                          <div>
                            <div className="time-big">{flight.departure}</div>
                            <div className="airport-code">NBO</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{flight.duration}</div>
                            <div className="line-bar" />
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{flight.stops}</div>
                          </div>
                          <div>
                            <div className="time-big">{flight.arrival}</div>
                            <div className="airport-code">LHR</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div className="price-amount">
                          {flight.currency} {flight.price.toLocaleString()}
                        </div>
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
                        {f.airline} ({f.flightNo})
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
                          {f.currency} {f.price.toLocaleString()}
                        </strong>
                      </div>
                      <div className="spec-row">
                        <span>Departure</span>
                        <span>{f.departure}</span>
                      </div>
                      <div className="spec-row">
                        <span>Duration</span>
                        <span>{f.duration}</span>
                      </div>
                      <div className="spec-row">
                        <span>Stops</span>
                        <span>{f.stops}</span>
                      </div>
                      <div className="spec-row">
                        <span>Aircraft</span>
                        <span>{f.aircraft}</span>
                      </div>
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
          {savedIds.length === 0 ? (
            <p style={{ color: "#64748b" }}>No saved flights yet. Click "Save flight" on any flight details page.</p>
          ) : (
            <div className="flight-list">
              {FLIGHTS_DATA.filter((f) => savedIds.includes(f.id)).map((flight) => (
                <div key={flight.id} className="card flight-card">
                  <div>
                    <strong>
                      {flight.airline} · {flight.flightNo}
                    </strong>
                    <p style={{ fontSize: "13px", color: "#64748b" }}>
                      {flight.outboundDate} · {flight.departure} – {flight.arrival} ({flight.duration})
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <strong>
                      {flight.currency} {flight.price.toLocaleString()}
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