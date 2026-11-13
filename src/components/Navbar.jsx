import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

// Placeholder navbar matching the Figma header. Replace with the team's shared navbar
// when the Home/search page (SCRUM-6) lands. Only "Linked trips" has a real page for now.
const LINKS = [
  { to: "/", label: "Search flights", end: true },
  { to: "/compare", label: "Compare" },
  { to: "/saved", label: "Saved flights" },
  { to: "/linked-trips", label: "Linked trips" },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo" aria-hidden="true">A</span>
          Anga360
        </Link>
        <nav className="navbar__links" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="navbar__auth">
          <Link to="/login" className="navbar__btn navbar__btn--outline">Log in</Link>
          <Link to="/signup" className="navbar__btn navbar__btn--solid">Sign up</Link>
        </div>
      </div>
    </header>
  );
}