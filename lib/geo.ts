/**
 * Cambodia's national road network, and the pickup rules built on it.
 *
 * A bus heading to Siem Reap runs up National Road 6 — it will never pass a
 * passenger waiting on National Road 2. So the pickup pin is only valid on a
 * road that actually serves the chosen destination, which is what `roadsFor`
 * resolves and the pickup map draws.
 *
 * The paths below are coarse waypoints; `useNationalRoads` routes through them
 * to get the real carriageway geometry. Accuracy comes from that routing, not
 * from the numbers here.
 */

export type LatLng = [number, number];

export const PHNOM_PENH_BBOX = {
  minLat: 11.45,
  maxLat: 11.65,
  minLng: 104.75,
  maxLng: 105.0,
} as const;

/**
 * The real width of a Cambodian national road, in metres.
 *
 * NR1–NR7 are predominantly two-lane: roughly 7 m of carriageway plus sealed
 * shoulders, so about 12 m edge to edge. This is what the green corridor is
 * drawn against, so the band on screen is the size of the actual road.
 */
export const ROAD_WIDTH_M = 12;

/**
 * How far from a road centre-line still counts as "on the road", in metres.
 *
 * Half the road width plus a little slack for the gap between the routed
 * centre-line and where someone is actually standing. Anything looser starts
 * swallowing the village lanes that branch off the highway, and a bus will not
 * turn down one of those to collect anyone.
 */
export const ROAD_TOLERANCE_M = 12;
export const ROAD_TOLERANCE_KM = ROAD_TOLERANCE_M / 1000;


export type RoadCorridor = {
  id: string;
  name: string;
  /** Provinces this road carries traffic to, in both directions. */
  serves: string[];
  path: LatLng[];
};

const PHNOM_PENH_POINT: LatLng = [11.5564, 104.9282];

export const NATIONAL_ROADS: RoadCorridor[] = [
  {
    id: "NR1",
    name: "National Road 1",
    serves: ["Prey Veng", "Svay Rieng", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
      [11.48, 105.05],
      [11.265, 105.28],
      [11.15, 105.55],
      [11.0879, 105.7993],
    ],
  },
  {
    id: "NR2",
    name: "National Road 2",
    serves: ["Takeo", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
      [11.4, 104.88],
      [11.2, 104.83],
      [10.9909, 104.785],
    ],
  },
  {
    id: "NR3",
    name: "National Road 3",
    serves: ["Kampot", "Kep", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
      [11.45, 104.85],
      [11.3, 104.7],
      [11.1, 104.55],
      [10.9, 104.4],
      [10.75, 104.3],
      [10.6104, 104.181],
    ],
  },
  {
    id: "NR4",
    name: "National Road 4",
    serves: ["Sihanoukville", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
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
    serves: ["Battambang", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
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
    serves: ["Siem Reap", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
      [11.8, 104.95],
      [12.1, 105.0],
      [12.4, 104.9],
      [12.7, 104.7],
      [13.0, 104.4],
      [13.2, 104.1],
      [13.3671, 103.8448],
    ],
  },
  {
    id: "NR7",
    name: "National Road 7",
    serves: ["Kampong Cham", "Kratie", "Phnom Penh"],
    path: [
      PHNOM_PENH_POINT,
      [11.8, 104.95],
      [11.93, 105.05],
      [11.9934, 105.4635],
      [12.2, 105.75],
      [12.4881, 106.0189],
    ],
  },
];

/**
 * Roads a bus to `destination` would actually travel. Falls back to the whole
 * network when the destination is unknown, so an unmapped province doesn't
 * leave the passenger with nowhere valid to pin.
 */
export function roadsFor(destination: string | null | undefined): RoadCorridor[] {
  if (!destination) return NATIONAL_ROADS;
  const matches = NATIONAL_ROADS.filter((road) =>
    road.serves.some((province) => province.toLowerCase() === destination.toLowerCase())
  );
  return matches.length > 0 ? matches : NATIONAL_ROADS;
}

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

/** Nearest road to a point, measured against whichever corridors are passed in. */
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

/**
 * A pickup is valid anywhere along a national road that serves the chosen
 * destination, including where that road begins inside Phnom Penh.
 *
 * There is deliberately no exclusion around the city. Restricting pins to the
 * corridors already rules out ordinary city streets, which was the actual
 * concern — an operator leaving Phnom Penh is still on the national road as it
 * runs out through the city, and a passenger waiting at that end of it is on
 * the bus's route like any other.
 */
export function isPickupAllowed(
  lat: number,
  lng: number,
  roads: RoadCorridor[] = NATIONAL_ROADS
): boolean {
  const nearest = nearestRoad(lat, lng, roads);
  return nearest !== null && nearest.distanceKm <= ROAD_TOLERANCE_KM;
}
