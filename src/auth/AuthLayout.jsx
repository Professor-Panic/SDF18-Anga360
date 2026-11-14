import { Link } from "react-router-dom";
import "./auth.css";

const C = 400; // globe center (viewBox units)
const R = 392; // globe radius
const TILT = (11 * Math.PI) / 180; // lean of the globe toward the viewer
const rad = (d) => (d * Math.PI) / 180;

// 3D (lat, lon) -> 2D point
function project(lat, lon) {
  const x = C + R * Math.cos(lat) * Math.sin(lon);
  const y =
    C -
    R * (Math.sin(lat) * Math.cos(TILT) - Math.cos(lat) * Math.cos(lon) * Math.sin(TILT));
  return [x, y];
}

// Latitude lines
const PARALLELS = [-60, -30, 0, 30, 60, 80].map((deg) => {
  const lat = rad(deg);
  return {
    cy: C - R * Math.sin(lat) * Math.cos(TILT),
    rx: R * Math.cos(lat),
    ry: R * Math.cos(lat) * Math.sin(TILT),
  };
});

// Longitude lines (full loops through both poles)
const MERIDIANS = [0, 20, 40, 60, 80, 100, 120, 140, 160].map((deg) => {
  const lon = rad(deg);
  const pts = [];
  for (let i = 0; i < 90; i++) {
    const [x, y] = project((i / 90) * Math.PI * 2, lon);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return "M " + pts.join(" L ") + " Z";
});

// Closed elliptical orbit touching the globe's edge
const orbit = (ry) =>
  `M ${C - R} ${C} A ${R} ${ry} 0 1 1 ${C + R} ${C} A ${R} ${ry} 0 1 1 ${C - R} ${C} Z`;

const FLIGHTS = [
  { ry: 150, angle: -28, dur: 16, delay: 0 },
  { ry: 240, angle: 24, dur: 22, delay: -9 },
];

function AuthLayout({ activeTab, children }) {
  return (
    <div className="auth-page">
      <svg className="auth-globe" viewBox="0 0 800 800" aria-hidden="true">
        <defs>
          {/* plane faces right (+x) so rotate="auto" points the nose forward */}
          <path
            id="plane-shape"
            d="M 12 0 L 2 -2 L -2 -10 L -5 -10 L -3 -2 L -9 -1 L -11 -5 L -13 -5 L -12 0 L -13 5 L -11 5 L -9 1 L -3 2 L -5 10 L -2 10 L 2 2 Z"
          />
        </defs>

        <g className="auth-globe-lines">
          {PARALLELS.map((p, i) => (
            <ellipse key={`p${i}`} cx={C} cy={p.cy} rx={p.rx} ry={p.ry} />
          ))}
          {MERIDIANS.map((d, i) => (
            <path key={`m${i}`} d={d} />
          ))}
        </g>

        <circle className="auth-globe-rim" cx={C} cy={C} r={R} />

        {FLIGHTS.map((f, i) => {
          const d = orbit(f.ry);
          return (
            <g key={i} transform={`rotate(${f.angle} ${C} ${C})`}>
              {/* dashed trail that follows the plane */}
              <path
                className="auth-flight-path"
                d={d}
                pathLength="1000"
                strokeDasharray="10 10 10 10 10 10 10 10 10 910"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="90"
                  to="-910"
                  dur={`${f.dur}s`}
                  begin={`${f.delay}s`}
                  repeatCount="indefinite"
                />
              </path>

              {/* the plane */}
              <g>
                <animateMotion
                  path={d}
                  dur={`${f.dur}s`}
                  begin={`${f.delay}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                />
                <use className="auth-plane" href="#plane-shape" transform="scale(0.85)" />
              </g>
            </g>
          );
        })}
      </svg>

      <div className="auth-logo">
        <span className="auth-logo-box">A</span>
        Anga360
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <Link
            to="/"
            className={activeTab === "login" ? "auth-tab auth-tab-active" : "auth-tab"}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className={activeTab === "register" ? "auth-tab auth-tab-active" : "auth-tab"}
          >
            Create account
          </Link>
        </div>

        {children}
      </div>

      <p className="auth-note">
        Anga360 doesn't sell tickets or take payments. This page is a design
        preview, so nothing is sent.
      </p>
    </div>
  );
}

export default AuthLayout;