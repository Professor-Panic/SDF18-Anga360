import "../flight-search-compare/styles/anga360.css";

export default function Footer({ onSwitchTab }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img
            src="/anga360-logo.jpeg"
            alt="Anga360 Logo"
            className="footer-logo"
          />
          <p className="footer-tagline">
            Compare fares, inspect aircraft specs, and track live flights across East Africa and beyond.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Explore</h4>
          <button onClick={() => onSwitchTab?.("search")}>Search flights</button>
          <button onClick={() => onSwitchTab?.("compare")}>Compare matrix</button>
          <button onClick={() => onSwitchTab?.("saved")}>Saved flights</button>
          <button onClick={() => onSwitchTab?.("live")}>Live flight status</button>
        </div>

        <div className="footer-links-group">
          <h4>Support & Info</h4>
          <button onClick={() => onSwitchTab?.("trips")}>Linked trips</button>
          <span className="footer-static-link">Baggage & Fare Rules</span>
          <span className="footer-static-link">Carbon Emissions Methodology</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Anga360. All rights reserved.</span>
        <span>Prices and availability are fetched from airline partners and may change.</span>
      </div>
    </footer>
  );
}