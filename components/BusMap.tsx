"use client";

import "leaflet/dist/leaflet.css";
import MapAttribution from "@/components/MapAttribution";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import RecenterControl from "@/components/RecenterControl";
import { PHNOM_PENH } from "@/constants/booking";
import { TILE_ATTRIBUTION, TILE_LABEL_URL, TILE_URL, userIcon } from "@/lib/mapTheme";

/**
 * The passenger's own map. Deliberately shows only their location — plotting
 * live vehicles here would publish every operator's fleet positions to anyone
 * who opens the app.
 */
export default function BusMap() {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  const locate = useCallback((setInitialCenter: boolean) => {
    if (!("geolocation" in navigator)) {
      if (setInitialCenter) setCenter(PHNOM_PENH);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPos(pos);
        if (setInitialCenter) setCenter(pos);
      },
      () => {
        if (setInitialCenter) setCenter(PHNOM_PENH);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    locate(true);
  }, [locate]);

  if (!center) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  return (
    <MapContainer
      attributionControl={false}
      center={center}
      zoom={15}
      // Pinch and wheel zoom stay on — this is the passenger's main map.
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}

      {userPos && <Marker position={userPos} icon={userIcon} />}

      {/* Sits above the bottom nav so it never ends up underneath it. Pressing
          it re-reads the device location before flying, so it follows the user
          rather than returning to wherever they were when the page loaded. */}
      <RecenterControl
        target={userPos ?? center}
        zoom={16}
        label="Zoom to my location"
        bottomOffset={100}
        onPress={() => locate(false)}
      />
      <MapAttribution />
    </MapContainer>
  );
}
