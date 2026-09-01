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
 * Cached at module level: the roads never change, so this runs once per page
 * load at most. Falls back to the coarse waypoints if routing is unavailable.
 */
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

let cached: RoadCorridor[] | null = null;
let inFlight: Promise<RoadCorridor[]> | null = null;

async function routeRoad(road: RoadCorridor): Promise<RoadCorridor> {
  try {
    const coords = road.path.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const response = await fetch(
      `${OSRM_ROUTE_URL}/${coords}?overview=full&geometries=geojson`
    );
    if (!response.ok) return road;

    const data = await response.json();
    const geometry: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
    if (!geometry || geometry.length < 2) return road;

    // GeoJSON is [lng, lat]; our corridors are [lat, lng].
    return { ...road, path: geometry.map(([lng, lat]) => [lat, lng] as [number, number]) };
  } catch {
    return road;
  }
}

async function loadRoads(): Promise<RoadCorridor[]> {
  if (cached) return cached;
  if (!inFlight) {
    inFlight = Promise.all(NATIONAL_ROADS.map(routeRoad)).then((roads) => {
      cached = roads;
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
