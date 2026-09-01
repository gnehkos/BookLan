"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import { colors } from "@/constants/theme";

const EARTH_RADIUS_KM = 6371;

/**
 * Public OSRM demo server. It has no API key and no uptime guarantee and its
 * usage policy rules out production traffic — swap in a keyed provider (Mapbox
 * Directions, Google Routes) or a self-hosted OSRM before launch. If the call
 * fails we fall back to a straight line so the map still works.
 */
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * `bookings` tracks how far the bus still is, not where it is, so the bus
 * marker sits that real distance from the pickup pin on a bearing derived from
 * the booking id. Distance and ETA are real; the heading is filler until the
 * schema carries live vehicle coordinates.
 */
function offsetPosition(
  origin: [number, number],
  distanceKm: number,
  bearingDegrees: number
): [number, number] {
  const [lat, lng] = origin;
  const angular = distanceKm / EARTH_RADIUS_KM;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:${colors.secondary};border:3px solid white;box-shadow:0 0 0 4px ${colors.secondary}33;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const busIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:white;border:1.5px solid ${colors.border};box-shadow:0 3px 5px rgba(13,17,23,0.16);font-size:18px;">\u{1F68C}</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

/** Keeps the whole route in view as its geometry arrives. */
function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points).pad(0.25));
  }, [map, points]);

  return null;
}

export default function TrackingMap({
  lat,
  lng,
  bookingId,
  distanceKm,
  company,
  destination,
  etaMinutes,
}: {
  lat: number;
  lng: number;
  bookingId: string;
  distanceKm: number;
  company: string;
  destination: string;
  etaMinutes: number;
}) {
  const pickup: [number, number] = [lat, lng];
  const busPosition = offsetPosition(pickup, distanceKm, hash(bookingId) % 360);
  const [roadRoute, setRoadRoute] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (distanceKm <= 0) {
      setRoadRoute(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function loadRoute() {
      try {
        const from = `${busPosition[1]},${busPosition[0]}`;
        const to = `${pickup[1]},${pickup[0]}`;
        const response = await fetch(
          `${OSRM_ROUTE_URL}/${from};${to}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );
        if (!response.ok) return;

        const data = await response.json();
        const coordinates: [number, number][] | undefined =
          data?.routes?.[0]?.geometry?.coordinates;
        if (!coordinates || cancelled) return;

        // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
        setRoadRoute(coordinates.map(([clng, clat]) => [clat, clng]));
      } catch {
        // Offline or the demo server is unhappy — the straight-line fallback stands.
      }
    }

    loadRoute();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-route whenever the bus moves closer.
  }, [bookingId, distanceKm, lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const linePoints = roadRoute ?? [busPosition, pickup];

  return (
    <MapContainer
      bounds={L.latLngBounds([pickup, busPosition]).pad(0.4)}
      zoomControl={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {distanceKm > 0 && (
        <>
          <Polyline
            positions={linePoints}
            pathOptions={{
              color: colors.primary,
              weight: 5,
              opacity: 0.85,
              // Dashed only while we're guessing with a straight line.
              dashArray: roadRoute ? undefined : "8 8",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <FitRoute points={linePoints} />
        </>
      )}

      <Marker position={pickup} icon={userIcon}>
        <Tooltip permanent direction="top" offset={[0, -10]}>
          You
        </Tooltip>
      </Marker>

      {distanceKm > 0 && (
        <Marker position={busPosition} icon={busIcon}>
          <Popup>
            <span className="block text-[13px] font-extrabold text-text-primary">{company}</span>
            <span className="block text-[11px] text-text-secondary">to {destination}</span>
            <span className="mt-0.5 block text-[12px] font-bold text-primary">
              {etaMinutes} min · {distanceKm} km away
            </span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
