
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

function Filter_Card({ title, type = "text", options, placeholder }) {
    return (
        <div className="homepage-filter-card">
            <p className="homepage-filter-card-title">{title}</p>

            {options ? (
                <div className="homepage-filter-input-container">
                    <select className="homepage-filter-card-input">
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
                    />
                </div>
            )}
        </div>
    );
}

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="class-homepage">

            <div className="class-homepage-top-bar">

                <div className="homepage-start">
                    <button className="homepage-A">A</button>
                    <p className="homepage-title">Anga 360</p>
                </div>

                <div className="homepage-center">
                    <button
                        className="center-button"
                        onClick={() => navigate("/dashboard")}
                    >
                        Search flights
                    </button>

                    <button
                        className="center-button"
                        onClick={() => navigate("/compare")}
                    >
                        Compare flights
                    </button>

                    <button
                        className="center-button"
                        onClick={() => navigate("/saved")}
                    >
                        Saved flights
                    </button>

                    <button
                        className="center-button"
                        onClick={() => navigate("/dashboard/linked-trips")}
                    >
                        Linked trips
                    </button>
                </div>

                <div className="homepage-registration">
                    <button
                        className="button-login"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                    <button
                        className="button-signup"
                        onClick={() => navigate("/register")}
                    >
                        Sign up
                    </button>
                </div>

            </div>

            <div className="class-homepage-middle-area">
                <p className="homepage-hero-content">
                    Find and compare flights in one place
                </p>

                <p className="homepage-hero-explanation">
                    Search one-way or round-trip flights, sort and filter the results,
                    and compare up to three options side by side.
                </p>

                <div className="homepage-search-card">

                    <div className="search-category">
                        <button className="search-filter-button">Round trip</button>
                        <button className="search-filter-button">One way</button>
                    </div>

                    <div className="homepage-search-filters">
                        <Filter_Card title="From" type="text" placeholder="City or airport" />
                        <Filter_Card title="To" type="text" placeholder="City or airport" />
                        <Filter_Card title="Departure" type="date" />
                        <Filter_Card title="Return" type="date" />
                        <Filter_Card title="Cabin class" options={cabinOptions} />

                        <button className="homepage-search-button">
                            Search flights
                        </button>
                    </div>

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

            <div className="homepage-footer">
                <div className="homepage-footer-notice">
                    <p>
                        Prices and availability can change. Every set of results shows when the search was run.
                    </p>
                </div>

                <div className="homepage-footer-privacy">
                    <p>Anga360 · Flight data from SerpApi Google Flights</p>
                </div>
            </div>

        </div>
    );
}