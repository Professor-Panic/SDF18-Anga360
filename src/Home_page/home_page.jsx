
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

const cabinOptions = [
    { value: "economy", label: "Economy" },
    { value: "premium", label: "Premium economy" },
    { value: "business", label: "Business" },
];

function Workings_Card(props) {
    return (
        <div className="homepage-working-card">
            <p className="homepage-working-card-number">{props.number}</p>
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
                            title="From" placeholder="Airport code, e.g. NBO" maxLength={3}
                            value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                        />
                        <Filter_Card
                            title="To" placeholder="Airport code, e.g. LHR" maxLength={3}
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