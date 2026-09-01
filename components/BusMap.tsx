"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { colors } from "@/constants/theme";
import { PHNOM_PENH } from "@/constants/booking";

export type MapVehicle = {
  id: string;
  company: string;
  vehicleType: "bus" | "van";
  destination: string;
  distanceKm: number;
  price: number;
};

const EARTH_RADIUS_KM = 6371;

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * `active_trips` stores how far away a bus is but not where it is, so we place
 * each marker at its real distance on a bearing derived from its id. The
 * distance shown is real; the compass direction is filler until the schema
 * carries live coordinates.
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

function vehicleIcon(type: "bus" | "van") {
  const emoji = type === "bus" ? "\u{1F68C}" : "\u{1F690}";
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:white;border:1.5px solid ${colors.border};box-shadow:0 3px 5px rgba(13,17,23,0.16);font-size:18px;">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:${colors.secondary};border:3px solid white;box-shadow:0 0 0 4px ${colors.secondary}33;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function BusMap({ vehicles = [] }: { vehicles?: MapVehicle[] }) {
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
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {vehicles.map((vehicle) => {
        const bearing = hash(vehicle.id) % 360;
        const position = offsetPosition(center, vehicle.distanceKm, bearing);

        return (
          <Marker key={vehicle.id} position={position} icon={vehicleIcon(vehicle.vehicleType)}>
            <Popup>
              <span className="block text-[13px] font-extrabold text-text-primary">
                {vehicle.company}
              </span>
              <span className="block text-[11px] text-text-secondary">
                {vehicle.distanceKm} km away · {vehicle.destination}
              </span>
              <span className="mt-0.5 block text-[13px] font-extrabold text-primary">
                ${vehicle.price.toFixed(2)}
              </span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
