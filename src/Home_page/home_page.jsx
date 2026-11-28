
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

const cabinOptions = [
    { value: "economy", label: "Economy" },
    { value: "premium", label: "Premium economy" },
    { value: "business", label: "Business" },
];

function RouteArt() {
    // Decorative route map: Nairobi to three hubs. Drawn once on load.
    return (
        <svg className="hero-routes" viewBox="0 0 520 360" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="routeFade" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#fbb740" />
                    <stop offset="1" stopColor="#bcd5fb" />
                </linearGradient>
            </defs>
            <circle className="hero-globe" cx="300" cy="230" r="190" />
            <ellipse className="hero-globe" cx="300" cy="230" rx="82" ry="190" />
            <ellipse className="hero-globe" cx="300" cy="230" rx="190" ry="70" />
            <path className="hero-arc hero-arc-1" d="M120 262 C 170 110, 330 60, 452 98" />
            <path className="hero-arc hero-arc-2" d="M120 262 C 220 200, 330 190, 430 250" />
            <path className="hero-arc hero-arc-3" d="M120 262 C 150 180, 230 140, 300 150" />
            <g className="hero-pins">
                <circle cx="452" cy="98" r="5" /><circle cx="430" cy="250" r="5" /><circle cx="300" cy="150" r="5" />
            </g>
            <circle className="hero-origin-pulse" cx="120" cy="262" r="9" />
            <circle className="hero-origin" cx="120" cy="262" r="7" />
            <text className="hero-label" x="96" y="292">NBO</text>
            <text className="hero-label" x="458" y="94">LHR</text>
            <text className="hero-label" x="436" y="272">DXB</text>
            <text className="hero-label" x="306" y="140">ADD</text>
        </svg>
    );
}

const STEP_ICONS = {
    Search: (
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
    ),
    Compare: (
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M17 4v16M4 8l3-4 3 4M14 16l3 4 3-4" /></svg>
    ),
    Continue: (
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
    ),
};

function Workings_Card(props) {
    return (
        <div className="homepage-working-card">
            <div className="homepage-working-card-top">
                <span className="homepage-working-card-icon">{STEP_ICONS[props.title]}</span>
                <p className="homepage-working-card-number">Step {props.number}</p>
            </div>
            <p className="homepage-working-card-title">{props.title}</p>
            <p className="homepage-working-card-explanation">{props.explanation}</p>
        </div>
    );
}

function Filter_Card({ title, type = "text", options, placeholder, value, onChange, onClear, min, maxLength }) {
    return (
        <div className="homepage-filter-card">
            <p className="homepage-filter-card-title">{title}</p>

            {options ? (
                <div className="homepage-filter-input-container">
                    <select className="homepage-filter-card-input" value={value} onChange={onChange}>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="homepage-filter-input-container">
                    <input
                        className="homepage-filter-card-input"
                        type={type}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        min={min}
                        maxLength={maxLength}
                    />
                    {onClear && value && (
                        <button type="button" className="homepage-filter-clear" onClick={onClear} aria-label={`Clear ${title}`}>
                            ×
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function HomePage() {
    const navigate = useNavigate();
    const today = new Date().toISOString().slice(0, 10);

    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [date, setDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [cabin, setCabin] = useState("economy");
    const [error, setError] = useState("");

    const handleSearch = () => {
        const from = origin.trim().toUpperCase();
        const to = destination.trim().toUpperCase();

        if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
            setError("Enter 3-letter airport codes, e.g. NBO or LHR.");
            return;
        }
        if (!date) {
            setError("Pick a departure date.");
            return;
        }
        // the return date is optional: leave it empty for a one-way search
        if (returnDate && returnDate < date) {
            setError("Pick a return date on or after your departure.");
            return;
        }

        setError("");
        navigate("/search", {
            state: {
                query: {
                    origin: from,
                    destination: to,
                    date,
                    returnDate,
                    cabin,
                },
            },
        });
    };

    return (
        <div className="class-homepage">

            <div className="class-homepage-middle-area">
                <RouteArt />
                <p className="homepage-hero-content">
                    Find and compare flights in one place
                </p>

                <p className="homepage-hero-explanation">
                    Search one-way or round-trip flights, sort and filter the results,
                    and compare up to three options side by side. Add a return date for a
                    round trip, or leave it empty for one way.
                </p>

                <div className="homepage-search-card">

                    <div className="homepage-search-filters">
                        <Filter_Card
                            title="From" placeholder="e.g. NBO" maxLength={3}
                            value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                        />
                        <Filter_Card
                            title="To" placeholder="e.g. LHR" maxLength={3}
                            value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())}
                        />
                        <Filter_Card
                            title="Departure" type="date" min={today}
                            value={date} onChange={(e) => setDate(e.target.value)}
                        />
                        <Filter_Card
                            title="Return (optional)" type="date" min={date || today}
                            value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                            onClear={() => setReturnDate("")}
                        />
                        <Filter_Card
                            title="Cabin class" options={cabinOptions}
                            value={cabin} onChange={(e) => setCabin(e.target.value)}
                        />

                        <button className="homepage-search-button" onClick={handleSearch}>
                            Search flights
                        </button>
                    </div>

                    {error && <p className="homepage-search-error">{error}</p>}

                </div>
            </div>

            <div className="class-homepage-workings">
                <p className="homepage-workings-title">How Anga360 works</p>

                <div className="homepage-working-cards">
                    <Workings_Card
                        number="1"
                        title="Search"
                        explanation="Enter your route, dates, passengers and cabin class. Airport suggestions appear after two characters."
                    />

                    <Workings_Card
                        number="2"
                        title="Compare"
                        explanation="Sort by price, duration or departure time, filter by airline and stops, then compare up to three flights side by side."
                    />

                    <Workings_Card
                        number="3"
                        title="Continue"
                        explanation="Open the airline or booking provider to finish your booking. Anga360 does not sell tickets or take payments."
                    />
                </div>
            </div>

        </div>
    );
}