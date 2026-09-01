export type LatLng = [number, number];

const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LNG_AT_EQUATOR = 111.32;

function segmentLength(a: LatLng, b: LatLng) {
  const refLat = (a[0] + b[0]) / 2;
  const dx =
    (b[1] - a[1]) * KM_PER_DEG_LNG_AT_EQUATOR * Math.cos((refLat * Math.PI) / 180);
  const dy = (b[0] - a[0]) * KM_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/** Running distance along a path, so a fraction can be resolved to a point. */
function cumulative(points: LatLng[]) {
  const totals = [0];
  for (let i = 1; i < points.length; i++) {
    totals.push(totals[i - 1] + segmentLength(points[i - 1], points[i]));
  }
  return totals;
}

/**
 * Where you are after travelling `fraction` (0–1) of a path, measured by real
 * distance rather than by index — otherwise dense clusters of points would
 * make the marker crawl and sparse stretches would make it jump.
 */
export function pointAtFraction(points: LatLng[], fraction: number): LatLng {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];

  const clamped = Math.max(0, Math.min(1, fraction));
  const totals = cumulative(points);
  const total = totals[totals.length - 1];
  if (total === 0) return points[0];

  const target = total * clamped;
  for (let i = 1; i < totals.length; i++) {
    if (totals[i] < target) continue;

    const spanned = totals[i] - totals[i - 1];
    const t = spanned === 0 ? 0 : (target - totals[i - 1]) / spanned;
    const [aLat, aLng] = points[i - 1];
    const [bLat, bLng] = points[i];
    return [aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t];
  }

  return points[points.length - 1];
}

/** The part of the path still ahead of you, starting at the current position. */
export function sliceFrom(points: LatLng[], fraction: number): LatLng[] {
  if (points.length < 2) return points;

  const clamped = Math.max(0, Math.min(1, fraction));
  const totals = cumulative(points);
  const total = totals[totals.length - 1];
  if (total === 0) return points;

  const target = total * clamped;
  const head = pointAtFraction(points, clamped);
  const rest = points.filter((_, i) => totals[i] > target);
  return [head, ...rest];
}
