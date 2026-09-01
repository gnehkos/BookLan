"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Rectangle } from "react-leaflet";
import RecenterControl from "@/components/RecenterControl";
import { PHNOM_PENH } from "@/constants/booking";
import { ROAD_TOLERANCE_KM, isPickupAllowed, nearestRoad } from "@/lib/geo";
import { useNationalRoads } from "@/lib/useNationalRoads";
import { TILE_ATTRIBUTION, TILE_URL, dropPinIcon } from "@/lib/mapTheme";

/** Zone colours are deliberately deeper than the UI status colours so the
 *  overlays stay readable at 15% fill over pale map tiles. */
const NO_PICKUP_RED = "#DC2626";
const PICKUP_GREEN = "#16A34A";

/** Covers all of Cambodia — everything here is no-pickup unless a road is drawn over it. */
const NO_PICKUP_BOUNDS: L.LatLngBoundsExpression = [
  [9.5, 102.0],
  [15.0, 108.0],
];

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
  onPositionChange,
}: {
  onPositionChange: (
    position: [number, number],
    allowed: boolean,
    roadName: string | null
  ) => void;
}) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  // Real routed geometry; falls back to the coarse waypoints until it lands.
  const { roads } = useNationalRoads();

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

  return (
    <MapContainer center={center} zoom={12} zoomControl={false} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

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

      {/* …with the allowed national-road corridors punched back in green. */}
      {roads.map((road) => (
        <Polyline
          key={`${road.id}-corridor`}
          positions={road.path}
          pathOptions={{
            color: PICKUP_GREEN,
            // Roughly the tolerance band, in screen terms, at this zoom.
            weight: ROAD_TOLERANCE_KM * 9,
            opacity: 0.15,
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

      <DraggableMarker position={position} allowed={allowed} onChange={handleChange} />

      <RecenterControl target={position} zoom={14} label="Recenter to my pin" />
    </MapContainer>
  );
}
