"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Rectangle } from "react-leaflet";
import { colors } from "@/constants/theme";
import { PHNOM_PENH } from "@/constants/booking";
import { NATIONAL_ROADS, ROAD_TOLERANCE_KM, isPickupAllowed } from "@/lib/geo";

/** Covers all of Cambodia — everything here is no-pickup unless a road is drawn over it. */
const NO_PICKUP_BOUNDS: L.LatLngBoundsExpression = [
  [9.5, 102.0],
  [15.0, 108.0],
];

function pinIcon(allowed: boolean) {
  const fill = allowed ? colors.success : colors.error;
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${fill};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
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
      icon={pinIcon(allowed)}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

export default function PickupMap({
  onPositionChange,
}: {
  onPositionChange: (position: [number, number], allowed: boolean) => void;
}) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    function resolve(pos: [number, number]) {
      setCenter(pos);
      setPosition(pos);
      onPositionChange(pos, isPickupAllowed(pos[0], pos[1]));
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
    onPositionChange(pos, isPickupAllowed(pos[0], pos[1]));
  }

  if (!center || !position) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  const allowed = isPickupAllowed(position[0], position[1]);

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full" attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* No-pickup wash over everything… */}
      <Rectangle
        bounds={NO_PICKUP_BOUNDS}
        pathOptions={{
          color: colors.error,
          weight: 0,
          fillColor: colors.error,
          fillOpacity: 0.12,
        }}
      />

      {/* …with the allowed national-road corridors punched back in green. */}
      {NATIONAL_ROADS.map((road) => (
        <Polyline
          key={`${road.id}-corridor`}
          positions={road.path}
          pathOptions={{
            color: colors.success,
            // Roughly the tolerance band, in screen terms, at this zoom.
            weight: ROAD_TOLERANCE_KM * 9,
            opacity: 0.3,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
      {NATIONAL_ROADS.map((road) => (
        <Polyline
          key={road.id}
          positions={road.path}
          pathOptions={{ color: colors.success, weight: 3, opacity: 0.9 }}
        />
      ))}

      <DraggableMarker position={position} allowed={allowed} onChange={handleChange} />
    </MapContainer>
  );
}
