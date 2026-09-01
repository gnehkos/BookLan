"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import RecenterControl from "@/components/RecenterControl";
import { PHNOM_PENH } from "@/constants/booking";
import { TILE_ATTRIBUTION, TILE_LABEL_URL,
  TILE_URL, userIcon } from "@/lib/mapTheme";

/**
 * The passenger's own map. Deliberately shows only their location — plotting
 * live vehicles here would publish every operator's fleet positions to anyone
 * who opens the app.
 */
export default function BusMap() {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCenter(PHNOM_PENH);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPos(pos);
        setCenter(pos);
      },
      () => setCenter(PHNOM_PENH),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  if (!center) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  return (
    <MapContainer
      center={center}
      zoom={10}
      // Pinch and wheel zoom stay on — this is the passenger's main map.
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}

      {userPos && <Marker position={userPos} icon={userIcon} />}

      <RecenterControl target={userPos ?? center} zoom={11} label="Recenter to my location" />
    </MapContainer>
  );
}
