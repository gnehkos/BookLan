"use client";

import { useEffect, useState } from "react";

/**
 * Public OSRM demo server. No API key, no uptime guarantee, and its usage
 * policy rules out production traffic — swap in a keyed provider (Mapbox
 * Directions, Google Routes) or self-hosted OSRM before launch.
 */
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

export type LatLng = [number, number];

/**
 * Road-following geometry between two points. Returns null until it resolves,
 * and stays null if the request fails so callers can fall back to a straight
 * line rather than showing nothing.
 */
export function useRoadRoute(from: LatLng | null, to: LatLng | null): LatLng[] | null {
  const [route, setRoute] = useState<LatLng[] | null>(null);

  const fromKey = from ? `${from[0]},${from[1]}` : "";
  const toKey = to ? `${to[0]},${to[1]}` : "";

  useEffect(() => {
    if (!fromKey || !toKey) {
      setRoute(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const [fromLat, fromLng] = fromKey.split(",");
        const [toLat, toLng] = toKey.split(",");
        const response = await fetch(
          `${OSRM_ROUTE_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );
        if (!response.ok) return;

        const data = await response.json();
        const coordinates: [number, number][] | undefined =
          data?.routes?.[0]?.geometry?.coordinates;
        if (!coordinates || cancelled) return;

        // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
        setRoute(coordinates.map(([lng, lat]) => [lat, lng] as LatLng));
      } catch {
        // Offline or the demo server is unhappy — caller falls back.
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fromKey, toKey]);

  return route;
}
