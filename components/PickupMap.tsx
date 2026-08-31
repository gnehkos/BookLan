"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { colors } from "@/constants/theme";
import { PHNOM_PENH } from "@/constants/booking";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${colors.secondary};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function DraggableMarker({
  position,
  onChange,
}: {
  position: [number, number];
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
      icon={pinIcon}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

export default function PickupMap({
  onPositionChange,
}: {
  onPositionChange: (position: [number, number]) => void;
}) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCenter(PHNOM_PENH);
      setPosition(PHNOM_PENH);
      onPositionChange(PHNOM_PENH);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const resolved: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(resolved);
        setPosition(resolved);
        onPositionChange(resolved);
      },
      () => {
        setCenter(PHNOM_PENH);
        setPosition(PHNOM_PENH);
        onPositionChange(PHNOM_PENH);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [onPositionChange]);

  function handleChange(pos: [number, number]) {
    setPosition(pos);
    onPositionChange(pos);
  }

  if (!center || !position) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  return (
    <MapContainer center={center} zoom={15} className="h-full w-full" attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <DraggableMarker position={position} onChange={handleChange} />
    </MapContainer>
  );
}
