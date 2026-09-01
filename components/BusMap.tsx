"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin } from "lucide-react";
import RecenterControl from "@/components/RecenterControl";
import { PHNOM_PENH } from "@/constants/booking";
import { TILE_ATTRIBUTION, TILE_URL, userIcon, vehicleIcon } from "@/lib/mapTheme";

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
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

      {userPos && <Marker position={userPos} icon={userIcon} />}

      {vehicles.map((vehicle) => {
        const bearing = hash(vehicle.id) % 360;
        const position = offsetPosition(center, vehicle.distanceKm, bearing);

        return (
          <Marker key={vehicle.id} position={position} icon={vehicleIcon(vehicle.company)}>
            <Popup>
              <span className="block text-[14px] font-semibold text-text-primary">
                {vehicle.company}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[12px] text-text-secondary">
                <MapPin className="h-3 w-3 text-text-secondary" />
                <span className="font-medium text-text-primary">{vehicle.distanceKm} km</span>
                <span>· {vehicle.destination}</span>
              </span>
              <span className="mt-1 block text-[16px] font-bold text-primary">
                ${vehicle.price.toFixed(2)}
              </span>
            </Popup>
          </Marker>
        );
      })}

      <RecenterControl target={userPos ?? center} zoom={11} label="Recenter to my location" />
    </MapContainer>
  );
}
