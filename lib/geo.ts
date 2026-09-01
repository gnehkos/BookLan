/**
 * Geography helpers for pickup rules.
 *
 * BookLan's on-road pickup only works where a bus can actually pull over on a
 * national road. Two rules fall out of that:
 *
 *  1. Inside Phnom Penh city centre there is no national road to flag a bus
 *     down on, so those passengers board at a station instead of dropping a pin.
 *  2. Outside the city, the pin must sit close to one of the national roads.
 *
 * The road paths below are approximate centre-lines — enough to gate the pin
 * and draw the allowed corridor, not survey data.
 */

export type LatLng = [number, number];

export const PHNOM_PENH_BBOX = {
  minLat: 11.45,
  maxLat: 11.65,
  minLng: 104.75,
  maxLng: 105.0,
} as const;

/** How far from a road centre-line still counts as "on the road", in km. */
export const ROAD_TOLERANCE_KM = 2;

export type RoadCorridor = {
  id: string;
  name: string;
  destination: string;
  path: LatLng[];
};

export const NATIONAL_ROADS: RoadCorridor[] = [
  {
    id: "NR3",
    name: "National Road 3",
    destination: "Kampot",
    path: [
      [11.5564, 104.9282],
      [11.45, 104.85],
      [11.3, 104.7],
      [11.1, 104.55],
      [10.9, 104.4],
      [10.75, 104.3],
      [10.61, 104.18],
    ],
  },
  {
    id: "NR4",
    name: "National Road 4",
    destination: "Sihanoukville",
    path: [
      [11.5564, 104.9282],
      [11.5, 104.75],
      [11.42, 104.55],
      [11.3, 104.3],
      [11.15, 104.05],
      [10.95, 103.85],
      [10.8, 103.7],
      [10.6277, 103.523],
    ],
  },
  {
    id: "NR5",
    name: "National Road 5",
    destination: "Battambang",
    path: [
      [11.5564, 104.9282],
      [11.75, 104.85],
      [12.0, 104.75],
      [12.25, 104.6],
      [12.55, 104.35],
      [12.8, 103.9],
      [13.0, 103.5],
      [13.0957, 103.2022],
    ],
  },
  {
    id: "NR6",
    name: "National Road 6",
    destination: "Siem Reap",
    path: [
      [11.5564, 104.9282],
      [11.8, 104.95],
      [12.1, 105.0],
      [12.4, 104.9],
      [12.7, 104.7],
      [13.0, 104.4],
      [13.2, 104.1],
      [13.3671, 103.8448],
    ],
  },
];

export function isInsidePhnomPenh(lat: number, lng: number): boolean {
  return (
    lat >= PHNOM_PENH_BBOX.minLat &&
    lat <= PHNOM_PENH_BBOX.maxLat &&
    lng >= PHNOM_PENH_BBOX.minLng &&
    lng <= PHNOM_PENH_BBOX.maxLng
  );
}

const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LNG_AT_EQUATOR = 111.32;

/**
 * Project to local planar km around a reference latitude. Cambodia spans a
 * couple of degrees, so the distortion is far below the tolerance we gate on.
 */
function toPlanar(lat: number, lng: number, refLat: number): [number, number] {
  const x = lng * KM_PER_DEG_LNG_AT_EQUATOR * Math.cos((refLat * Math.PI) / 180);
  const y = lat * KM_PER_DEG_LAT;
  return [x, y];
}

function distancePointToSegmentKm(
  point: LatLng,
  start: LatLng,
  end: LatLng,
  refLat: number
): number {
  const [px, py] = toPlanar(point[0], point[1], refLat);
  const [ax, ay] = toPlanar(start[0], start[1], refLat);
  const [bx, by] = toPlanar(end[0], end[1], refLat);

  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby;

  // Degenerate segment: fall back to point-to-point.
  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSquared));
  const closestX = ax + t * abx;
  const closestY = ay + t * aby;
  return Math.hypot(px - closestX, py - closestY);
}

/**
 * Nearest national road to a point, with the distance to its centre-line.
 *
 * Pass `roads` to measure against real routed geometry (see useNationalRoads);
 * without it this falls back to the coarse hand-plotted corridors above, which
 * are straight between waypoints and therefore only roughly right.
 */
export function nearestRoad(
  lat: number,
  lng: number,
  roads: RoadCorridor[] = NATIONAL_ROADS
): { road: RoadCorridor; distanceKm: number } | null {
  let best: { road: RoadCorridor; distanceKm: number } | null = null;

  for (const road of roads) {
    for (let i = 0; i < road.path.length - 1; i++) {
      const distanceKm = distancePointToSegmentKm(
        [lat, lng],
        road.path[i],
        road.path[i + 1],
        lat
      );
      if (!best || distanceKm < best.distanceKm) {
        best = { road, distanceKm };
      }
    }
  }

  return best;
}

export function isPickupAllowed(
  lat: number,
  lng: number,
  roads: RoadCorridor[] = NATIONAL_ROADS
): boolean {
  const nearest = nearestRoad(lat, lng, roads);
  return nearest !== null && nearest.distanceKm <= ROAD_TOLERANCE_KM;
}
