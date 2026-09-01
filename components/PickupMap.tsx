"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Rectangle, useMap } from "react-leaflet";
import RecenterControl from "@/components/RecenterControl";
import { PHNOM_PENH } from "@/constants/booking";
import { ROAD_TOLERANCE_KM, isPickupAllowed, nearestRoad, roadsFor } from "@/lib/geo";
import { useNationalRoads } from "@/lib/useNationalRoads";
import { TILE_ATTRIBUTION, TILE_LABEL_URL,
  TILE_URL, dropPinIcon } from "@/lib/mapTheme";

/** Zone colours are deliberately deeper than the UI status colours so the
 *  overlays stay readable at 15% fill over pale map tiles. */
const NO_PICKUP_RED = "#DC2626";
const PICKUP_GREEN = "#16A34A";

/** Covers all of Cambodia — everything here is no-pickup unless a road is drawn over it. */
const NO_PICKUP_BOUNDS: L.LatLngBoundsExpression = [
  [9.5, 102.0],
  [15.0, 108.0],
];

/**
 * Pixel width of the allowed corridor at the current zoom.
 *
 * Leaflet strokes are measured in pixels but the pickup rule is measured in
 * kilometres, so a fixed weight drew a band far narrower than what was
 * actually accepted — a pin could sit well outside the green line and still
 * pass. Recomputing on zoom keeps the drawing honest.
 */
function useCorridorWeight(toleranceKm: number) {
  const map = useMap();
  const [weight, setWeight] = useState(() => corridorPixels(map, toleranceKm));

  useEffect(() => {
    const update = () => setWeight(corridorPixels(map, toleranceKm));
    map.on("zoomend", update);
    map.on("moveend", update);
    return () => {
      map.off("zoomend", update);
      map.off("moveend", update);
    };
  }, [map, toleranceKm]);

  return weight;
}

function corridorPixels(map: L.Map, toleranceKm: number) {
  const center = map.getCenter();
  // Metres per pixel at this latitude and zoom.
  const metresPerPixel =
    (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / 2 ** map.getZoom();
  // The band spans the tolerance either side of the centre-line.
  return Math.max(3, (2 * toleranceKm * 1000) / metresPerPixel);
}

/** Roads drawn at their true allowed width, plus a crisp centre-line. */
function RoadCorridors({ roads }: { roads: { id: string; path: [number, number][] }[] }) {
  const weight = useCorridorWeight(ROAD_TOLERANCE_KM);

  return (
    <>
      {roads.map((road) => (
        <Polyline
          key={`${road.id}-corridor`}
          positions={road.path}
          pathOptions={{
            color: PICKUP_GREEN,
            weight,
            opacity: 0.18,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
      {roads.map((road) => (
        <Polyline
          key={road.id}
          positions={road.path}
          pathOptions={{
            color: PICKUP_GREEN,
            weight: 3,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
    </>
  );
}

function DraggableMarker({
  position,
  allowed,
  onChange,
}: {
  position: [number, number];
  allowed: boolean;
  onChange: (position: [number, number]) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (!marker) return;
        const { lat, lng } = marker.getLatLng();
        onChange([lat, lng]);
      },
    }),
    [onChange]
  );

  return (
    <Marker
      draggable
      position={position}
      icon={dropPinIcon(allowed)}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

export default function PickupMap({
  destination,
  onPositionChange,
  bottomInset = 0,
}: {
  /** Only roads serving this destination are drawn and accepted. */
  destination: string;
  onPositionChange: (
    position: [number, number],
    allowed: boolean,
    roadName: string | null
  ) => void;
  /** Height of the floating sheet, so controls sit clear of it. */
  bottomInset?: number;
}) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  // Real routed geometry; falls back to the coarse waypoints until it lands.
  const { roads: allRoads } = useNationalRoads();
  // A bus to Siem Reap runs NR6 — it never passes someone waiting on NR2.
  const serving = roadsFor(destination).map((road) => road.id);
  const roads = allRoads.filter((road) => serving.includes(road.id));

  const report = useCallback(
    (pos: [number, number]) => {
      const nearest = nearestRoad(pos[0], pos[1], roads);
      onPositionChange(pos, isPickupAllowed(pos[0], pos[1], roads), nearest?.road.name ?? null);
    },
    [onPositionChange, roads]
  );

  // Re-check once the real road shapes arrive: a pin that looked off-road
  // against the straight-line approximation may sit on the actual highway.
  useEffect(() => {
    if (position) report(position);
  }, [report, position]);

  useEffect(() => {
    function resolve(pos: [number, number]) {
      setCenter(pos);
      setPosition(pos);
    }

    if (!("geolocation" in navigator)) {
      resolve(PHNOM_PENH);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      () => resolve(PHNOM_PENH),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [onPositionChange]);

  function handleChange(pos: [number, number]) {
    setPosition(pos);
    report(pos);
  }

  if (!center || !position) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  const allowed = isPickupAllowed(position[0], position[1], roads);

  // Zoomed in: at a 50 m tolerance the roadside is only targetable up close.
  return (
    <MapContainer center={center} zoom={16} zoomControl={false} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}

      {/* No-pickup wash over everything, with a dashed red edge… */}
      <Rectangle
        bounds={NO_PICKUP_BOUNDS}
        pathOptions={{
          color: NO_PICKUP_RED,
          weight: 2,
          dashArray: "8 6",
          opacity: 0.55,
          fillColor: NO_PICKUP_RED,
          fillOpacity: 0.15,
        }}
      />

      {/* …with the allowed national-road corridors punched back in green, at
          their true width so the drawing matches what's accepted. */}
      <RoadCorridors roads={roads} />

      <DraggableMarker position={position} allowed={allowed} onChange={handleChange} />

      <RecenterControl
        target={position}
        zoom={14}
        label="Recenter to my pin"
        bottomOffset={bottomInset + 100}
      />
    </MapContainer>
  );
}
