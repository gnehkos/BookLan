"use client";

import "leaflet/dist/leaflet.css";
import MapAttribution from "@/components/MapAttribution";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { MapPin } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import RecenterControl from "@/components/RecenterControl";
import { colors } from "@/constants/theme";
import { TILE_ATTRIBUTION, TILE_LABEL_URL, TILE_URL, userIcon, vehicleIcon } from "@/lib/mapTheme";
import { useRoadRoute } from "@/lib/useRoadRoute";
import { pointAtFraction, sliceFrom, type LatLng } from "@/lib/polyline";

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
 * `bookings` tracks how far the bus still is, not where it is, so the bus
 * marker sits that real distance from the pickup pin on a bearing derived from
 * the booking id. Distance and ETA are real; the heading is filler until the
 * schema carries live vehicle coordinates.
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

/** Keeps the whole route in view as its geometry arrives. */
/**
 * Frames the approach once. Re-fitting on every countdown tick made the map
 * judder and creep inward; after the first fit the bus is followed by panning
 * only when it drifts out of view.
 */
function FitOnce({
  points,
  bottomPadding,
  follow,
}: {
  points: LatLng[];
  bottomPadding: number;
  follow: LatLng;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || points.length < 2) return;
    fitted.current = true;
    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [24, 72],
      paddingBottomRight: [24, bottomPadding],
      animate: false,
    });
  }, [map, points, bottomPadding]);

  useEffect(() => {
    if (!fitted.current) return;
    if (map.getBounds().pad(-0.2).contains(follow)) return;
    map.panTo(follow, { animate: true, duration: 1.2 });
  }, [map, follow]);

  return null;
}

export default function TrackingMap({
  lat,
  lng,
  bookingId,
  distanceKm,
  company,
  destination,
  etaMinutes,
  panelHeight,
}: {
  lat: number;
  lng: number;
  bookingId: string;
  distanceKm: number;
  company: string;
  destination: string;
  etaMinutes: number;
  panelHeight: number;
}) {
  const pickup: LatLng = [lat, lng];

  // Anchor the route to where the bus started so the geometry is fetched once
  // and the marker slides along it, instead of re-routing every countdown tick.
  const startDistance = useRef(distanceKm);
  if (distanceKm > startDistance.current) startDistance.current = distanceKm;
  const startPosition = offsetPosition(pickup, startDistance.current, hash(bookingId) % 360);

  const roadRoute = useRoadRoute(startPosition, pickup);
  const path: LatLng[] = roadRoute ?? [startPosition, pickup];

  const travelled =
    startDistance.current > 0 ? 1 - distanceKm / startDistance.current : 1;
  const busPosition = pointAtFraction(path, travelled);
  const linePoints = sliceFrom(path, travelled);

  return (
    <MapContainer
      attributionControl={false}
      bounds={L.latLngBounds([pickup, startPosition]).pad(0.4)}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}

      {distanceKm > 0 && (
        <>
          <Polyline
            positions={linePoints}
            // `booklan-route` animates the dashes toward the pickup pin.
            className="booklan-route"
            pathOptions={{
              color: colors.primary,
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <FitOnce points={path} bottomPadding={panelHeight} follow={busPosition} />
        </>
      )}

      {/* The "You" label is baked into the marker itself. */}
      <Marker position={pickup} icon={userIcon} />

      {distanceKm > 0 && (
        <Marker position={busPosition} icon={vehicleIcon(company)}>
          <Popup>
            <span className="mb-1.5 flex items-center gap-2">
              <CompanyLogo name={company} size={28} />
              <span className="text-[14px] font-semibold text-text-primary">{company}</span>
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[12px] text-text-secondary">
              <MapPin className="h-3 w-3 text-text-secondary" />
              <span className="font-medium text-text-primary">{distanceKm} km</span>
              <span>· to {destination}</span>
            </span>
            <span className="mt-1 block text-[16px] font-bold text-primary">
              {etaMinutes} min away
            </span>
          </Popup>
        </Marker>
      )}

      <RecenterControl
        target={pickup}
        zoom={13}
        label="Recenter to my location"
        bottomOffset={panelHeight + 16}
      />
      <MapAttribution />
    </MapContainer>
  );
}
