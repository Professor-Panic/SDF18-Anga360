import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext.js";
import "../flight-search-compare/styles/anga360.css";
import InstallPwaButton from './InstallPwaButton';

export default function Navbar({
  compareCount = 0,
  savedCount = 0,
  onNavigate,//(used for the jet sound)
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const itemClass = (isActive) => `nav-item ${isActive ? "active" : ""}`;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="brand" aria-label="Anga360 home" onClick={onNavigate}>
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
            to="/"
            end
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            Home
          </NavLink>
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
            Compare flights {compareCount > 0 ? `(${compareCount})` : ""}
          </NavLink>
          <NavLink
            to="/saved"
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            Saved flights {savedCount > 0 ? `(${savedCount})` : ""}
          </NavLink>
          <NavLink
            to="/linked-trips"
            onClick={onNavigate}
            className={({ isActive }) => itemClass(isActive)}
          >
            Linked trips
          </NavLink>
        </nav>
      </div>

      <div className="navbar-right">
        <InstallPwaButton />
        {user ? (
          <>
        
            <span style={{ fontSize: "14px", color: "#334155" }}>
              Hi, {(user.full_name || user.email).split(" ")[0]}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}