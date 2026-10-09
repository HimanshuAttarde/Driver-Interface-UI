// Geolocation & Navigation Math Helpers for Smooth Vehicle Movement

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates
 */
export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lng2 - lng1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates heading / bearing (0 to 360 degrees) from point 1 to point 2
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lng2 - lng1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Linear interpolation (Lerp) between two scalar values
 */
export function lerp(start: number, end: number, t: number): number {
  const clampedT = Math.max(0, Math.min(1, t));
  return start + (end - start) * clampedT;
}

/**
 * Smooth angle interpolation that wraps around the 0° / 360° boundary
 */
export function lerpAngle(start: number, end: number, t: number): number {
  const clampedT = Math.max(0, Math.min(1, t));
  let diff = (end - start) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (start + diff * clampedT + 360) % 360;
}

/**
 * Calculates camera target offset ahead of the driver based on current heading
 */
export function getCameraLookaheadOffset(
  lat: number,
  lng: number,
  headingDeg: number,
  offsetDistanceDeg: number = 0.006
): [number, number] {
  const headingRad = (headingDeg * Math.PI) / 180;
  const offsetLat = Math.cos(headingRad) * offsetDistanceDeg;
  const offsetLng = Math.sin(headingRad) * offsetDistanceDeg;
  return [lat + offsetLat, lng + offsetLng];
}
