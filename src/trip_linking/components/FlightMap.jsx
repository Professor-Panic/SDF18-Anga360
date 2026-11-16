import { useEffect, useMemo, useRef, useState } from "react";
import * as Cesium from "cesium";
import { useLiveFlight } from "../hooks/useLiveFlight";
import { AIRPORTS, distanceKm } from "../utils/airports";
import { ALWAYS_VISIBLE, PLANE_ICON, arc, clock, dashed, demoPosition, label } from "../utils/mapHelpers";
import "../flight-map.css";

const TOKEN = import.meta.env.VITE_CESIUM_TOKEN;
Cesium.Ion.defaultAccessToken = TOKEN;

const SPIN_SPEED = 0.0004; // bigger number = faster rotation
const PLANE_HEIGHT = 11000; // metres above the ground
const SEARCH_STATUSES = ["departed", "in_air"]; // only look for the plane in these
const LANDED_STATUSES = ["landed", "at_gate"];
const DEMO_ENABLED = import.meta.env.DEV; // simulated plane only while developing
const DEMO_PROGRESS = 0.6; // 0 = at origin, 1 = at destination

// Cesium's built-in widgets we don't want.
const WIDGETS_OFF = {
  baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
  navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false,
  infoBox: false, selectionIndicator: false,
};

function Notice({ children }) {
  return (
    <section className="tl-card tl-card--dashed" aria-labelledby="tl-map-title">
      <h2 id="tl-map-title" className="tl-card__title tl-card__title--small">Live flight map</h2>
      <p className="tl-card__text">{children}</p>
    </section>
  );
}

export default function FlightMap({ trip }) {
  const from = AIRPORTS[trip.origin?.code];
  const to = AIRPORTS[trip.destination?.code];
  const landed = LANDED_STATUSES.includes(trip.status);

  const { live: realLive, status } = useLiveFlight(
    trip.flightNumber,
    trip.origin?.code,
    trip.destination?.code,
    SEARCH_STATUSES.includes(trip.status)
  );

  // Mock flights aren't on OpenSky, so in dev we show a simulated plane instead.
  const demoLive = useMemo(
    () =>
      DEMO_ENABLED && !realLive && status === "not-found" && from && to
        ? demoPosition(from, to, DEMO_PROGRESS)
        : null,
    [realLive, status, from, to]
  );
  const live = realLive || demoLive;
  const isDemo = !realLive && Boolean(demoLive);

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [spinning, setSpinning] = useState(true);
  const spinningRef = useRef(true);

  // 1. Create the globe once, with real terrain and slow rotation.
  useEffect(() => {
    if (!TOKEN || !from || !to) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      ...WIDGETS_OFF,
    });
    viewer.scene.globe.enableLighting = true; // shades hills and mountains
    viewer.scene.verticalExaggeration = 2; // makes the relief easier to see
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees((from.lon + to.lon) / 2, (from.lat + to.lat) / 2, 16000000),
    });
    viewer.scene.postRender.addEventListener(() => {
      if (spinningRef.current) viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -SPIN_SPEED);
    });
    // Touching the globe stops the rotation. The button turns it back on.
    viewer.scene.canvas.addEventListener("pointerdown", () => setSpinning(false));

    viewerRef.current = viewer;
    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [from, to]);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  // 2. Draw the route, airports and plane. Runs again when the plane moves.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !from || !to) return;

    const added = [];
    const add = (options) => added.push(viewer.entities.add(options));

    // Orange = flown so far, dashed gold = still to fly.
    if (live || landed) {
      add({ polyline: { positions: arc(from, live || to), width: 4, material: Cesium.Color.ORANGE } });
    }
    if (!landed) {
      add({ polyline: { positions: arc(live || from, to), width: 3, material: dashed(Cesium.Color.GOLD) } });
    }

    [trip.origin.code, trip.destination.code].forEach((code) => {
      const airport = AIRPORTS[code];
      add({
        position: Cesium.Cartesian3.fromDegrees(airport.lon, airport.lat),
        point: {
          pixelSize: 11,
          color: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: ALWAYS_VISIBLE,
        },
        label: label(code, new Cesium.Cartesian2(14, -4), {
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        }),
      });
    });

    // The plane, turned to face the way it is flying.
    if (live) {
      add({
        position: Cesium.Cartesian3.fromDegrees(live.lon, live.lat, PLANE_HEIGHT),
        billboard: {
          image: PLANE_ICON,
          width: 36,
          height: 36,
          rotation: Cesium.Math.toRadians(-live.heading),
          disableDepthTestDistance: ALWAYS_VISIBLE,
        },
        label: label(trip.flightNumber, new Cesium.Cartesian2(0, -28)),
      });
    }

    return () => {
      if (!viewer.isDestroyed()) added.forEach((entity) => viewer.entities.remove(entity));
    };
  }, [trip.origin?.code, trip.destination?.code, trip.flightNumber, from, to, live, landed]);

  function focusOnPlane() {
    if (!live || !viewerRef.current) return;
    setSpinning(false);
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(live.lon, live.lat, 1500000),
      duration: 3,
    });
  }

  if (!from || !to) return <Notice>The map is not available for this route yet.</Notice>;
  if (!TOKEN) return <Notice>Add VITE_CESIUM_TOKEN to your .env file, then restart npm run dev.</Notice>;

  // Numbers shown under the globe.
  const km = live ? Math.round(distanceKm(live.lat, live.lon, to.lat, to.lon)) : null;
  const minutes = live && live.speedKmh ? Math.round((km / live.speedKmh) * 60) : null;
  const arrival = minutes === null ? null : new Date(live.updatedAt.getTime() + minutes * 60000);

  const stats = live && [
    ["Altitude", live.altitudeFt !== null ? `${live.altitudeFt.toLocaleString()} ft` : "–"],
    ["Ground speed", live.speedKmh !== null ? `${live.speedKmh} km/h` : "–"],
    [`Distance to ${trip.destination.code}`, `${km.toLocaleString()} km`],
    [
      "Estimated arrival",
      arrival ? clock(arrival) : "–",
      minutes !== null && `in about ${Math.floor(minutes / 60)}h ${minutes % 60}m`,
    ],
  ];

  let message = "";
  if (trip.status === "not_departed") message = "The live position will appear once the flight has departed.";
  else if (landed) message = `${trip.flightNumber} has landed.`;
  else if (isDemo) message = `${trip.flightNumber} is a mock flight, so this plane is simulated.`;
  else if (status === "searching") message = "Looking for the flight…";
  else if (status === "not-found")
    message = `${trip.flightNumber} is not visible on OpenSky yet. It may be out of range of receivers. We check again every 2 minutes.`;
  else if (status === "error") message = "Live flight data could not be loaded. We try again every 2 minutes.";

  return (
    <section className="tl-card tl-map-card" aria-labelledby="tl-map-title">
      <div className="tl-map-top">
        <div>
          <p className="tl-map-label">Live position</p>
          <h2 id="tl-map-title" className="tl-map-title">
            {live
              ? `${trip.flightNumber} is ${live.onGround ? "on the ground" : "in the air"}`
              : "Live flight map"}
          </h2>
        </div>
        {live && (
          <span className="tl-map-updated">
            {isDemo ? "Demo position" : `Updated ${clock(live.updatedAt)}`}
          </span>
        )}
      </div>

      {message && <p className="tl-map-message">{message}</p>}

      <div ref={containerRef} className="tl-map-globe" />

      <div className="tl-map-actions">
        <button type="button" className="tl-map-button" onClick={() => setSpinning(!spinning)}>
          {spinning ? "Stop rotating" : "Rotate globe"}
        </button>
        <button type="button" className="tl-map-button" onClick={focusOnPlane} disabled={!live}>
          Focus on plane
        </button>
      </div>

      <div className="tl-map-legend">
        <span><i className="tl-map-swatch tl-map-swatch--solid"></i>Flown so far</span>
        <span><i className="tl-map-swatch tl-map-swatch--dash"></i>Still to fly</span>
      </div>

      {stats && (
        <div className="tl-map-stats">
          {stats.map(([name, value, extra]) => (
            <div key={name} className="tl-map-stat">
              <small>{name}</small>
              <b>{value}</b>
              {extra && <span>{extra}</span>}
            </div>
          ))}
        </div>
      )}

      <p className="tl-map-note">
        {isDemo
          ? "Simulated position for a mock flight. Real flights use live data from the OpenSky Network."
          : "Live position from the OpenSky Network. The arrival time is estimated from speed and distance."}
      </p>
    </section>
  );
}