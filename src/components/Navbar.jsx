import { Link, NavLink, useLocation } from "react-router-dom";
import "../flight-search-compare/styles/anga360.css";

export default function Navbar({
  compareCount = 0,
  savedCount = 0,
  onNavigate, // optional: runs on every nav click (used for the jet sound)
}) {
  const { pathname } = useLocation();

  const itemClass = (isActive) => `nav-item ${isActive ? "active" : ""}`;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/search" className="brand" onClick={onNavigate}>
          <img
            src="/anga360-logo.jpeg"
            alt="Anga360 Logo"
            className="brand-logo"
          />
        </Link>
      </div>

      <div className="navbar-center">
        <nav className="nav-links" aria-label="Main">
          <NavLink
            to="/search"
            onClick={onNavigate}
            className={({ isActive }) =>
              itemClass(isActive || pathname === "/details")
            }
          >
            Search flights
          </NavLink>
          <NavLink
            to="/compare"
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            Compare {compareCount > 0 ? `(${compareCount})` : ""}
          </NavLink>
          <NavLink
            to="/saved"
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            Saved flights {savedCount > 0 ? `(${savedCount})` : ""}
          </NavLink>
          <NavLink
            to="/trips"
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            Linked trips
          </NavLink>
        </nav>
      </div>

      <div className="navbar-right">
        <Link to="/login" className="btn btn-secondary">
          Log in
        </Link>
        <Link to="/register" className="btn btn-primary">
          Sign up
        </Link>
      </div>
    </header>
  );
}