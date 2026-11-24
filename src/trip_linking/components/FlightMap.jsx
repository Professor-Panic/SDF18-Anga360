import { useEffect, useMemo, useRef, useState } from "react";
import * as Cesium from "cesium";
import { AIRPORTS, distanceKm } from "../utils/airports";
import { ALWAYS_VISIBLE, PLANE_ICON, arc, clock, dashed, demoPosition, label } from "../utils/mapHelpers";
import "../flight-map.css";

const firstNameOf = (name) => (name ? name.split(" ")[0] : "The traveller");

const TOKEN = import.meta.env.VITE_CESIUM_TOKEN;
Cesium.Ion.defaultAccessToken = TOKEN;

const SPIN_SPEED = 0.0004; // bigger number = faster rotation
const PLANE_HEIGHT = 11000; // metres above the ground
const LANDED_STATUSES = ["landed", "at_gate"];
const DEFAULT_CENTER = { lat: 0, lon: 25 }; // Africa, when we know nothing about the route
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

// `tracking` is the result of useLiveFlight for this trip (the parent owns it so the
// page and the map agree on whether the flight is flying or has landed).
export default function FlightMap({ trip, tracking, onSetFlightHidden }) {
  const from = AIRPORTS[trip.origin?.code];
  const to = AIRPORTS[trip.destination?.code];
  const landed = LANDED_STATUSES.includes(trip.status);
  const isTraveller = trip.role === "traveller";
  // The traveller hid the plane from the picker-upper and driver (until the flight lands).
  const hiddenFromMe = trip.flightHidden && !isTraveller && !landed;
  const { live: realLive, lastSeen, status } = tracking;
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  // Mock flights aren't on OpenSky, so in dev we show a simulated plane instead.
  const demoLive = useMemo(
    () =>
      DEMO_ENABLED && !hiddenFromMe && !realLive && status === "not-found" && !landed && from && to
        ? demoPosition(from, to, DEMO_PROGRESS)
        : null,
    [hiddenFromMe, realLive, status, landed, from, to]
  );
  // Once landed we keep the plane where OpenSky last saw it.
  const plane = hiddenFromMe ? null : realLive || (landed ? lastSeen : null) || demoLive;
  const live = hiddenFromMe ? null : realLive || demoLive; // moving position, used for the stats
  const isDemo = !realLive && Boolean(demoLive);
  const isLastSeen = !realLive && !demoLive && Boolean(plane);

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [spinning, setSpinning] = useState(true);
  const spinningRef = useRef(true);

  // 1. Create the globe once, with real terrain and slow rotation.
  useEffect(() => {
    if (!TOKEN) return;

    const centre = from && to ? { lat: (from.lat + to.lat) / 2, lon: (from.lon + to.lon) / 2 } : DEFAULT_CENTER;
    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      ...WIDGETS_OFF,
    });
    viewer.scene.globe.enableLighting = true; // shades hills and mountains
    viewer.scene.verticalExaggeration = 2; // makes the relief easier to see
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centre.lon, centre.lat, 16000000),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the globe is made once per trip (the page is keyed by trip)
  }, []);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  // 2. Draw the route, airports, plane and shared locations. Runs again when anything moves.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const added = [];
    const add = (options) => added.push(viewer.entities.add(options));

    // Orange = flown so far, dashed gold = still to fly.
    if (from && to) {
      if (plane || landed) {
        add({ polyline: { positions: arc(from, plane || to), width: 4, material: Cesium.Color.ORANGE } });
      }
      if (!landed) {
        add({ polyline: { positions: arc(plane || from, to), width: 3, material: dashed(Cesium.Color.GOLD) } });
      }
    }

    [trip.origin?.code, trip.destination?.code].forEach((code) => {
      const airport = AIRPORTS[code];
      if (!airport) return;
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
    if (plane) {
      add({
        position: Cesium.Cartesian3.fromDegrees(plane.lon, plane.lat, landed ? 0 : PLANE_HEIGHT),
        billboard: {
          image: PLANE_ICON,
          width: 36,
          height: 36,
          rotation: Cesium.Math.toRadians(-plane.heading),
          disableDepthTestDistance: ALWAYS_VISIBLE,
        },
        label: label(trip.flightNumber, new Cesium.Cartesian2(0, -28)),
      });
    }

    // Locations people chose to share: cyan = a person, gold = where the flight is.
    (trip.shared ?? []).forEach((spot) => {
      const name = spot.mine ? "You" : spot.sender_name.split(" ")[0];
      add({
        position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat),
        point: {
          pixelSize: 14,
          color: spot.kind === "flight" ? Cesium.Color.GOLD : Cesium.Color.CYAN,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: ALWAYS_VISIBLE,
        },
        label: label(spot.kind === "flight" ? `${name}: flight` : name, new Cesium.Cartesian2(0, -22)),
      });
    });

    return () => {
      if (!viewer.isDestroyed()) added.forEach((entity) => viewer.entities.remove(entity));
    };
  }, [trip.origin?.code, trip.destination?.code, trip.flightNumber, trip.shared, from, to, plane, landed]);

  // The first time the plane shows up, fly the camera to it so it is easy to spot.
  const hasFlownToPlane = useRef(false);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!plane || !viewer || hasFlownToPlane.current) return;
    hasFlownToPlane.current = true;
    setSpinning(false);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(plane.lon, plane.lat, 3000000),
      duration: 3,
    });
  }, [plane]);

  function focusOnPlane() {
    if (!plane || !viewerRef.current) return;
    setSpinning(false);
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(plane.lon, plane.lat, 1500000),
      duration: 3,
    });
  }

  if (!TOKEN) return <Notice>Can't access cesium at the moment.</Notice>;

  // Numbers shown under the globe.
  const km = live && to ? Math.round(distanceKm(live.lat, live.lon, to.lat, to.lon)) : null;
  const minutes = km !== null && live.speedKmh ? Math.round((km / live.speedKmh) * 60) : null;
  const arrival = minutes === null ? null : new Date(live.updatedAt.getTime() + minutes * 60000);

  const stats = live && [
    ["Altitude", live.altitudeFt !== null ? `${live.altitudeFt.toLocaleString()} ft` : "–"],
    ["Ground speed", live.speedKmh !== null ? `${live.speedKmh} km/h` : "–"],
    ...(km === null
      ? []
      : [
          [`Distance to ${trip.destination.code}`, `${km.toLocaleString()} km`],
          [
            "Estimated arrival",
            arrival ? clock(arrival) : "–",
            minutes !== null && `in about ${Math.floor(minutes / 60)}h ${minutes % 60}m`,
          ],
        ]),
  ];

  async function toggleHidden() {
    setToggling(true);
    setToggleError("");
    const result = await onSetFlightHidden(!trip.flightHidden);
    if (!result?.ok) setToggleError(result?.message || "Couldn't change that. Try again.");
    setToggling(false);
  }

  let message = "";
  if (hiddenFromMe) message = `${firstNameOf(trip.traveller?.name)} has hidden the flight's live position. It will show again once the flight has landed.`;
  else if (landed) message = `${trip.flightNumber} has landed.${isLastSeen ? " The plane is shown where OpenSky last saw it." : ""}`;
  else if (isDemo) message = `${trip.flightNumber} is a mock flight, so this plane is simulated.`;
  else if (status === "idle") message = "Live tracking starts on the day of the flight.";
  else if (status === "searching") message = "Looking for the flight…";
  else if (status === "not-found")
    message = `${trip.flightNumber} is not visible on OpenSky right now. It may not have taken off yet, or be out of range of receivers. We check again every 2 minutes.`;
  else if (status === "error") message = "Live flight data could not be loaded. We try again every 2 minutes.";
  else if (tracking.phase === "not_departed") message = `${trip.flightNumber} is on the ground and has not taken off yet.`;

  return (
    <section className="tl-card tl-map-card" aria-labelledby="tl-map-title">
      <div className="tl-map-top">
        <div>
          <p className="tl-map-label">Live position</p>
          <h2 id="tl-map-title" className="tl-map-title">
            {landed
              ? `${trip.flightNumber} has landed`
              : live
                ? `${trip.flightNumber} is ${live.onGround ? "on the ground" : "in the air"}`
                : "Live flight map"}
          </h2>
        </div>
        {plane && (
          <span className="tl-map-updated">
            {isDemo ? "Demo position" : `${isLastSeen ? "Last seen" : "Updated"} ${clock(plane.updatedAt)}`}
          </span>
        )}
      </div>

      {message && <p className="tl-map-message">{message}</p>}

      <div ref={containerRef} className="tl-map-globe" />

      <div className="tl-map-actions">
        <button type="button" className="tl-map-button" onClick={() => setSpinning(!spinning)}>
          {spinning ? "Stop rotating" : "Rotate globe"}
        </button>
        <button type="button" className="tl-map-button" onClick={focusOnPlane} disabled={!plane}>
          Focus on plane
        </button>
        {isTraveller && !landed && onSetFlightHidden && (
          <button type="button" className="tl-map-button" onClick={toggleHidden} disabled={toggling}>
            {toggling ? "Saving…" : trip.flightHidden ? "Show flight to picker-upper & driver" : "Hide flight from picker-upper & driver"}
          </button>
        )}
      </div>
      {isTraveller && !landed && trip.flightHidden && (
        <p className="tl-map-note">Your picker-upper and driver can't see where the plane is. You still can.</p>
      )}
      {toggleError && <p className="tl-error" role="alert">{toggleError}</p>}

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