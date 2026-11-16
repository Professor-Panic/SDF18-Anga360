import * as Cesium from "cesium";

export const ALWAYS_VISIBLE = Number.POSITIVE_INFINITY; // stops hills hiding markers

export const PLANE_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-14 -14 28 28">' +
      '<path d="M 0 -12 L 2 -2 L 10 3 L 10 5 L 2 3 L 1 9 L 4 11 L 4 12 L -4 12 L -4 11 L -1 9 L -2 3 L -10 5 L -10 3 L -2 -2 Z" fill="orange" stroke="white" stroke-width="1"/>' +
      "</svg>"
  );

// A curved line between two points. It rises in the middle like a flight path.
export function arc(a, b) {
  const start = Cesium.Cartographic.fromDegrees(a.lon, a.lat);
  const end = Cesium.Cartographic.fromDegrees(b.lon, b.lat);
  if (a.lat === b.lat && a.lon === b.lon) {
    return [Cesium.Cartesian3.fromDegrees(a.lon, a.lat), Cesium.Cartesian3.fromDegrees(b.lon, b.lat)];
  }
  const geodesic = new Cesium.EllipsoidGeodesic(start, end);
  const peak = geodesic.surfaceDistance * 0.06;
  return Array.from({ length: 41 }, (_, i) => {
    const spot = geodesic.interpolateUsingFraction(i / 40);
    return Cesium.Cartesian3.fromRadians(spot.longitude, spot.latitude, Math.sin(Math.PI * (i / 40)) * peak);
  });
}

export const dashed = (color) => new Cesium.PolylineDashMaterialProperty({ color, dashLength: 16 });

export const clock = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

// White bold text with a black outline, used for every label on the globe.
export const label = (text, pixelOffset, extra = {}) => ({
  text,
  font: "bold 14px sans-serif",
  fillColor: Cesium.Color.WHITE,
  outlineColor: Cesium.Color.BLACK,
  outlineWidth: 3,
  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
  pixelOffset,
  disableDepthTestDistance: ALWAYS_VISIBLE,
  ...extra,
});

// A simulated plane part-way along the route, for mock flights (dev only).
export function demoPosition(from, to, progress) {
  const end = Cesium.Cartographic.fromDegrees(to.lon, to.lat);
  const start = Cesium.Cartographic.fromDegrees(from.lon, from.lat);
  const spot = new Cesium.EllipsoidGeodesic(start, end).interpolateUsingFraction(progress);
  return {
    lat: Cesium.Math.toDegrees(spot.latitude),
    lon: Cesium.Math.toDegrees(spot.longitude),
    heading: Cesium.Math.toDegrees(new Cesium.EllipsoidGeodesic(spot, end).startHeading),
    altitudeFt: 36000,
    speedKmh: 905,
    onGround: false,
    updatedAt: new Date(),
  };
}