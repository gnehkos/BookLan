"use client";

import "leaflet/dist/leaflet.css";
import MapAttribution from "@/components/MapAttribution";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { TILE_ATTRIBUTION, TILE_LABEL_URL, TILE_URL, stationIcon } from "@/lib/mapTheme";

export default function StationMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      attributionControl={false}
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
      <TileLayer url={TILE_URL} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}
      <Marker position={[lat, lng]} icon={stationIcon} />
      <MapAttribution />
    </MapContainer>
  );
}
