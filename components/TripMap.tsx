"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { MapPin } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import RecenterControl from "@/components/RecenterControl";
import { colors } from "@/constants/theme";
import {
  TILE_ATTRIBUTION,
  TILE_LABEL_URL,
  TILE_URL,
  currentLocationIcon,
  destinationPinIcon,
} from "@/lib/mapTheme";
import { useRoadRoute } from "@/lib/useRoadRoute";
import { pointAtFraction, sliceFrom, type LatLng } from "@/lib/polyline";

/**
 * Frames the journey once, then leaves the viewport alone. Re-fitting on every
 * movement tick is what made the map judder and creep in on itself; after the
 * first fit the bus is followed by panning, never by zooming.
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
      // Keep the route clear of the floating panel and the header pill.
      paddingTopLeft: [24, 72],
      paddingBottomRight: [24, bottomPadding],
      animate: false,
    });
  }, [map, points, bottomPadding]);

  // Once framed, only nudge the view when the bus wanders off screen.
  useEffect(() => {
    if (!fitted.current) return;
    if (map.getBounds().pad(-0.2).contains(follow)) return;
    map.panTo(follow, { animate: true, duration: 1.2 });
  }, [map, follow]);

  return null;
}

/**
 * The on-trip view: you are on the bus, so the vehicle marker is your position
 * and the route runs ahead of you to the drop-off station.
 */
export default function TripMap({
  origin,
  destination,
  destinationName,
  company,
  progress,
  remainingKm,
  etaMinutes,
  panelHeight,
}: {
  origin: LatLng;
  destination: LatLng;
  destinationName: string;
  company: string;
  progress: number;
  remainingKm: number;
  etaMinutes: number;
  panelHeight: number;
}) {
  // Fixed endpoints, so this resolves once for the whole trip rather than
  // re-requesting a route on every tick.
  const roadRoute = useRoadRoute(origin, destination);
  const path: LatLng[] = roadRoute ?? [origin, destination];

  const position = pointAtFraction(path, progress);
  const ahead = sliceFrom(path, progress);
  const arrived = progress >= 1;

  return (
    <MapContainer
      bounds={L.latLngBounds([origin, destination]).pad(0.3)}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}

      {/* Travelled portion, faded out behind the bus. */}
      <Polyline
        positions={path}
        pathOptions={{ color: colors.border, weight: 4, opacity: 0.9, lineCap: "round" }}
      />

      {!arrived && (
        <Polyline
          positions={ahead}
          className="booklan-route"
          pathOptions={{
            color: colors.primary,
            weight: 4,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      <FitOnce points={path} bottomPadding={panelHeight} follow={position} />

      <Marker position={destination} icon={destinationPinIcon}>
        <Popup>
          <span className="block text-[14px] font-semibold text-text-primary">
            {destinationName}
          </span>
          <span className="mt-0.5 block text-[12px] text-text-secondary">Drop-off station</span>
        </Popup>
      </Marker>

      <Marker position={position} icon={currentLocationIcon}>
        <Popup>
          <span className="mb-1.5 flex items-center gap-2">
            <CompanyLogo name={company} size={28} />
            <span className="text-[14px] font-semibold text-text-primary">{company}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[12px] text-text-secondary">
            <MapPin className="h-3 w-3 text-text-secondary" />
            <span className="font-medium text-text-primary">{remainingKm} km</span>
            <span>to go</span>
          </span>
          <span className="mt-1 block text-[16px] font-bold text-primary">
            {etaMinutes} min left
          </span>
        </Popup>
      </Marker>

      <RecenterControl
        target={position}
        zoom={11}
        label="Recenter to the bus"
        bottomOffset={panelHeight + 16}
      />
    </MapContainer>
  );
}
