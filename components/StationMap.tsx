"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_URL, stationIcon } from "@/lib/mapTheme";

export default function StationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      className="h-full w-full"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Marker position={[lat, lng]} icon={stationIcon} />
    </MapContainer>
  );
}
