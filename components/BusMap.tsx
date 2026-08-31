"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { colors } from "@/constants/theme";

const PHNOM_PENH: [number, number] = [11.5564, 104.9282];

type VehicleType = "bus" | "van";

type StaticVehicle = {
  id: string;
  company: string;
  type: VehicleType;
  lat: number;
  lng: number;
};

const STATIC_VEHICLES: StaticVehicle[] = [
  { id: "vireak-buntham", company: "Vireak Buntham", type: "bus", lat: 11.78, lng: 104.95 },
  { id: "larita", company: "Larita", type: "van", lat: 11.92, lng: 104.97 },
  { id: "capitol-tour", company: "Capitol Tour", type: "bus", lat: 11.42, lng: 104.8 },
  { id: "mekong-express", company: "Mekong Express", type: "van", lat: 11.35, lng: 103.95 },
];

function vehicleIcon(type: VehicleType) {
  const emoji = type === "bus" ? "\u{1F68C}" : "\u{1F690}";
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${colors.primary};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);font-size:16px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:${colors.secondary};border:3px solid white;box-shadow:0 0 0 2px ${colors.secondary}66;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

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
      () => {
        setCenter(PHNOM_PENH);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  if (!center) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  return (
    <MapContainer
      center={center}
      zoom={9}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {STATIC_VEHICLES.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.lat, vehicle.lng]}
          icon={vehicleIcon(vehicle.type)}
        >
          <Popup>{vehicle.company}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
