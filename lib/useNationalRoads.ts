"use client";

import { useEffect, useState } from "react";
import { NATIONAL_ROADS, type RoadCorridor } from "@/lib/geo";

/**
 * Real geometry for the national roads.
 *
 * `NATIONAL_ROADS` only holds a handful of hand-plotted waypoints, so drawn
 * straight it looks nothing like the actual highway. This routes through those
 * waypoints to get the road's true shape — hundreds of points that bend with
 * the real carriageway — and the pickup rule is then measured against the same
 * geometry the passenger can see.
 *
 * Cached in sessionStorage as well as in module scope: the roads never change,
 * and without the persistent cache every fresh page load briefly draws the
 * coarse straight waypoints while routing is in flight. Falls back to those
 * waypoints if routing is unavailable.
 */
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";
const CACHE_KEY = "booklan_national_roads_v3";

/**
 * A returning point closer than this to an earlier one closes an excursion.
 * Generous enough to catch a divided highway's two carriageways.
 */
const SPUR_RETURN_KM = 0.03;

/** How far ahead to look for that return. Spurs are local, not page-length. */
const SPUR_LOOKAHEAD = 400;

/** Excursions shallower than this are real road bends, not routing artefacts. */
const SPUR_MIN_DEPTH_KM = 0.05;

/**
 * A national road reference, as OSM tags it: "5", or occasionally "NR5".
 * Provincial roads carry three-digit refs and city streets carry none.
 */
const NATIONAL_REF = /^(?:NR)?([1-7])$/;

/** A run shorter than this is a slip road or a roundabout, not the highway. */
const MIN_HIGHWAY_RUN_M = 1000;

const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LNG_AT_EQUATOR = 111.32;

function distanceKm(a: [number, number], b: [number, number]) {
  const refLat = (a[0] + b[0]) / 2;
  const dx = (b[1] - a[1]) * KM_PER_DEG_LNG_AT_EQUATOR * Math.cos((refLat * Math.PI) / 180);
  const dy = (b[0] - a[0]) * KM_PER_DEG_LAT;
  return Math.hypot(dx, dy);
}

/**
 * Removes out-and-back excursions from a routed path.
 *
 * The waypoints are plotted by hand and some sit a little off the carriageway.
 * OSRM snaps each one to the nearest routable way, which is occasionally a
 * village lane, and then dutifully routes down that lane and back — producing
 * a branch that does not exist on the real highway. Measured against the live
 * service, National Road 6 alone carried six of these, the deepest running
 * 7.2 km off-route before returning.
 *
 * The fix is geometric rather than a guess at better waypoints: wherever the
 * path comes back to within a few metres of a point it already visited, the
 * detour in between is dropped and the through-line is kept.
 *
 * Run to a fixed point, because removing one detour can bring the two ends of
 * a longer one within the lookahead window. On the live NR6 geometry this
 * takes three passes and brings the road from 456 km down to 332 km, against a
 * real Phnom Penh–Siem Reap length of roughly 320 km.
 */
export function stripSpurs(path: [number, number][]): [number, number][] {
  let current = path;

  for (let pass = 0; pass < 5; pass++) {
    const next = stripSpursOnce(current);
    if (next.length === current.length) return next;
    current = next;
  }

  return current;
}

function stripSpursOnce(path: [number, number][]): [number, number][] {
  if (path.length < 4) return path;

  const kept: [number, number][] = [];
  let i = 0;

  while (i < path.length) {
    kept.push(path[i]);

    const limit = Math.min(i + SPUR_LOOKAHEAD, path.length);
    let returnsAt = -1;

    // Search from the far end so the longest excursion is the one removed.
    for (let j = limit - 1; j > i + 2; j--) {
      if (distanceKm(path[i], path[j]) < SPUR_RETURN_KM) {
        returnsAt = j;
        break;
      }
    }

    if (returnsAt > 0) {
      let depth = 0;
      for (let k = i + 1; k < returnsAt; k++) {
        depth = Math.max(depth, distanceKm(path[i], path[k]));
      }
      // A shallow loop is a roundabout or a real bend; leave it alone.
      if (depth > SPUR_MIN_DEPTH_KM) {
        i = returnsAt;
        continue;
      }
    }

    i++;
  }

  return kept;
}

type Step = {
  ref?: string;
  distance: number;
  geometry?: { coordinates: [number, number][] };
};

function isNationalRef(ref: string | undefined) {
  return (ref ?? "")
    .replace(/,/g, ";")
    .split(";")
    .some((token) => NATIONAL_REF.test(token.trim()));
}

/**
 * Index of the step where the route first joins a national road for a real
 * distance.
 *
 * Routing out of Phnom Penh begins on city boulevards — Preah Sihanouk,
 * Sisowath Quay — which connect to the highway but are not part of it and carry
 * different names entirely. Including them made those streets pinnable. Steps
 * before this index are dropped, so a corridor starts where its road does.
 *
 * The test is "any national road", not "this one": a bus to Kampot runs NR2
 * before it runs NR3, and a bus to Kratie runs NR6 for 96 km before NR7.
 * Demanding the corridor's own ref from the first metre would cut off those
 * shared legs, which the bus genuinely travels.
 */
function firstHighwayStep(steps: Step[]): number {
  let i = 0;

  while (i < steps.length) {
    const ref = (steps[i].ref ?? "").trim();
    if (!isNationalRef(ref)) {
      i++;
      continue;
    }

    // Measure the contiguous run carrying this same ref.
    let run = 0;
    let j = i;
    while (j < steps.length && (steps[j].ref ?? "").trim() === ref) {
      run += steps[j].distance;
      j++;
    }
    if (run >= MIN_HIGHWAY_RUN_M) return i;
    i = j;
  }

  return 0;
}

let cached: RoadCorridor[] | null = null;
let inFlight: Promise<RoadCorridor[]> | null = null;

function readCache(): RoadCorridor[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoadCorridor[];
    return Array.isArray(parsed) && parsed.length === NATIONAL_ROADS.length ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(roads: RoadCorridor[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(roads));
  } catch {
    // Quota or private mode — the in-memory cache still serves this page.
  }
}

async function routeRoad(road: RoadCorridor): Promise<RoadCorridor> {
  try {
    const coords = road.path.map(([lat, lng]) => `${lng},${lat}`).join(";");
    // `steps` carries the per-street road refs used to drop the city approach.
    const response = await fetch(
      `${OSRM_ROUTE_URL}/${coords}?overview=full&geometries=geojson&steps=true`
    );
    if (!response.ok) return road;

    const data = await response.json();
    const route = data?.routes?.[0];

    const steps: Step[] = (route?.legs ?? []).flatMap((leg: { steps?: Step[] }) => leg.steps ?? []);
    let path: [number, number][] = [];

    if (steps.length > 0) {
      for (const step of steps.slice(firstHighwayStep(steps))) {
        for (const [lng, lat] of step.geometry?.coordinates ?? []) {
          const last = path[path.length - 1];
          // Steps share an endpoint with the next; keep one copy.
          if (!last || last[0] !== lat || last[1] !== lng) path.push([lat, lng]);
        }
      }
    }

    // Fall back to the whole-route geometry if steps were unavailable.
    if (path.length < 2) {
      const geometry: [number, number][] | undefined = route?.geometry?.coordinates;
      if (!geometry || geometry.length < 2) return road;
      // GeoJSON is [lng, lat]; our corridors are [lat, lng].
      path = geometry.map(([lng, lat]) => [lat, lng] as [number, number]);
    }

    return { ...road, path: stripSpurs(path) };
  } catch {
    return road;
  }
}

async function loadRoads(): Promise<RoadCorridor[]> {
  if (cached) return cached;

  const stored = readCache();
  if (stored) {
    cached = stored;
    return stored;
  }

  if (!inFlight) {
    inFlight = Promise.all(NATIONAL_ROADS.map(routeRoad)).then((roads) => {
      cached = roads;
      writeCache(roads);
      return roads;
    });
  }
  return inFlight;
}

export function useNationalRoads(): { roads: RoadCorridor[]; routed: boolean } {
  const [roads, setRoads] = useState<RoadCorridor[]>(cached ?? NATIONAL_ROADS);
  const [routed, setRouted] = useState(cached !== null);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;

    loadRoads().then((loaded) => {
      if (cancelled) return;
      setRoads(loaded);
      setRouted(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { roads, routed };
}
