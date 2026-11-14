import "../flight-search-compare/styles/anga360.css";

export default function Navbar({
  activeTab,
  onSwitchTab,
  compareCount = 0,
  savedCount = 0,
}) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="brand" onClick={() => onSwitchTab?.("search")}>
          <img
            src="/anga360-logo.jpeg"
            alt="Anga360 Logo"
            className="brand-logo"
          />
        </div>
      </div>

      <div className="navbar-center">
        <nav className="nav-links">
          <button
            className={`nav-item ${
              activeTab === "search" || activeTab === "details" ? "active" : ""
            }`}
            onClick={() => onSwitchTab?.("search")}
          >
            Search flights
          </button>
          <button
            className={`nav-item ${activeTab === "compare" ? "active" : ""}`}
            onClick={() => onSwitchTab?.("compare")}
          >
            Compare {compareCount > 0 ? `(${compareCount})` : ""}
          </button>
          <button
            className={`nav-item ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => onSwitchTab?.("saved")}
          >
            Saved flights {savedCount > 0 ? `(${savedCount})` : ""}
          </button>
          <button
            className={`nav-item ${activeTab === "trips" ? "active" : ""}`}
            onClick={() => onSwitchTab?.("trips")}
          >
            Linked trips
          </button>
        </nav>
      </div>

      <div className="navbar-right">
        <button className="btn btn-secondary" onClick={() => onSwitchTab?.("login")}>
          Log in
        </button>
        <button className="btn btn-primary" onClick={() => onSwitchTab?.("signup")}>
          Sign up
        </button>
      </div>
    </header>
  );
}