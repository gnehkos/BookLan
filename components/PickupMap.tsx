"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, Polyline, Rectangle, TileLayer, useMap } from "react-leaflet";
import RecenterControl from "@/components/RecenterControl";
import { PHNOM_PENH } from "@/constants/booking";
import {
  CITY_EXCLUSION_KM,
  ROAD_TOLERANCE_KM,
  clipOutsideCity,
  isPickupAllowed,
  nearestRoad,
  roadsFor,
} from "@/lib/geo";
import { useNationalRoads } from "@/lib/useNationalRoads";
import { TILE_ATTRIBUTION, TILE_LABEL_URL, TILE_URL, dropPinIcon } from "@/lib/mapTheme";

/** Zone colours are deliberately deeper than the UI status colours so the
 *  overlays stay readable at low fill over pale map tiles. */
const NO_PICKUP_RED = "#DC2626";
const PICKUP_GREEN = "#0FA36B";

/** Below this many pixels the true-width band is too thin to mean anything. */
const MIN_BAND_PX = 6;

/** Covers all of Cambodia — everything here is no-pickup unless a road is drawn over it. */
const NO_PICKUP_BOUNDS: L.LatLngBoundsExpression = [
  [9.5, 102.0],
  [15.0, 108.0],
];

/**
 * Pixel width of the allowed corridor at the current zoom.
 *
 * Leaflet strokes are measured in pixels but the pickup rule is measured in
 * metres, so this converts one to the other on every zoom. There is
 * deliberately no minimum: padding the band out is what previously made it
 * look several times wider than the road and invited pins onto side lanes.
 * Staying visible when zoomed out is the centre-line's job instead.
 */
function useCorridorWeight(toleranceKm: number) {
  const map = useMap();
  const [weight, setWeight] = useState(() => corridorPixels(map, toleranceKm));

  useEffect(() => {
    const update = () => setWeight(corridorPixels(map, toleranceKm));
    map.on("zoomend", update);
    map.on("moveend", update);
    return () => {
      map.off("zoomend", update);
      map.off("moveend", update);
    };
  }, [map, toleranceKm]);

  return weight;
}

function corridorPixels(map: L.Map, toleranceKm: number) {
  const center = map.getCenter();
  // Metres per pixel at this latitude and zoom.
  const metresPerPixel =
    (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / 2 ** map.getZoom();
  // The band spans the tolerance either side of the centre-line.
  return (2 * toleranceKm * 1000) / metresPerPixel;
}

/**
 * The pickup corridors, drawn in two layers that do different jobs.
 *
 * The centre-line is a constant 3px at every zoom, so the network stays
 * traceable when the whole country is on screen. The translucent band is the
 * true accepted width in metres, so once you are zoomed in far enough for it
 * to be meaningful it matches the size of the actual road — and below that it
 * is simply not drawn, rather than being inflated into a lie.
 */
function RoadCorridors({ roads }: { roads: { id: string; path: [number, number][] }[] }) {
  const bandWidth = useCorridorWeight(ROAD_TOLERANCE_KM);
  const showBand = bandWidth >= MIN_BAND_PX;

  // Corridors stop at the city ring, so each road can become several runs.
  const runs = useMemo(
    () =>
      roads.flatMap((road) =>
        clipOutsideCity(road.path).map((path, index) => ({ key: road.id + "-" + index, path }))
      ),
    [roads]
  );

  return (
    <>
      {showBand &&
        runs.map((run) => (
          <Polyline
            key={run.key + "-band"}
            positions={run.path}
            pathOptions={{
              color: PICKUP_GREEN,
              weight: bandWidth,
              opacity: 0.2,
              lineCap: "butt",
              lineJoin: "round",
            }}
          />
        ))}

      {runs.map((run) => (
        <Polyline
          key={run.key}
          positions={run.path}
          pathOptions={{
            color: PICKUP_GREEN,
            weight: 3,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
    </>
  );
}

/**
 * Long-press anywhere to drop the pin there, the way a map app does.
 *
 * `contextmenu` covers a right-click on desktop and a long-press on most touch
 * browsers; the manual timer covers the rest. A press that turns into a pan is
 * cancelled on the first few pixels of movement, so dragging the map never
 * moves the pin by accident.
 */
function PinOnLongPress({ onPin }: { onPin: (position: [number, number]) => void }) {
  const map = useMap();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let origin: L.Point | null = null;

    function cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      origin = null;
    }

    function onDown(e: L.LeafletMouseEvent) {
      origin = e.containerPoint;
      timer = setTimeout(() => {
        timer = null;
        onPin([e.latlng.lat, e.latlng.lng]);
      }, 450);
    }

    function onMove(e: L.LeafletMouseEvent) {
      if (!timer || !origin) return;
      if (origin.distanceTo(e.containerPoint) > 12) cancel();
    }

    function onContext(e: L.LeafletMouseEvent) {
      L.DomEvent.preventDefault(e.originalEvent);
      cancel();
      onPin([e.latlng.lat, e.latlng.lng]);
    }

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", cancel);
    map.on("dragstart", cancel);
    map.on("zoomstart", cancel);
    map.on("contextmenu", onContext);

    return () => {
      cancel();
      map.off("mousedown", onDown);
      map.off("mousemove", onMove);
      map.off("mouseup", cancel);
      map.off("dragstart", cancel);
      map.off("zoomstart", cancel);
      map.off("contextmenu", onContext);
    };
  }, [map, onPin]);

  return null;
}

function DraggableMarker({
  position,
  allowed,
  onChange,
}: {
  position: [number, number];
  allowed: boolean;
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
      icon={dropPinIcon(allowed)}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

export default function PickupMap({
  destination,
  onPositionChange,
  bottomInset = 0,
}: {
  /** Only roads serving this destination are drawn and accepted. */
  destination: string;
  onPositionChange: (
    position: [number, number],
    allowed: boolean,
    roadName: string | null
  ) => void;
  /** Height of the floating sheet, so controls sit clear of it. */
  bottomInset?: number;
}) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  // Real routed geometry; falls back to the coarse waypoints until it lands.
  const { roads: allRoads } = useNationalRoads();
  // A bus to Siem Reap runs NR6 — it never passes someone waiting on NR2.
  const servingKey = roadsFor(destination)
    .map((road) => road.id)
    .join(",");
  const roads = useMemo(
    () => allRoads.filter((road) => servingKey.split(",").includes(road.id)),
    [allRoads, servingKey]
  );

  const report = useCallback(
    (pos: [number, number]) => {
      const nearest = nearestRoad(pos[0], pos[1], roads);
      onPositionChange(pos, isPickupAllowed(pos[0], pos[1], roads), nearest?.road.name ?? null);
    },
    [onPositionChange, roads]
  );

  // Re-check once the real road shapes arrive: a pin that looked off-road
  // against the straight-line approximation may sit on the actual highway.
  useEffect(() => {
    if (position) report(position);
  }, [report, position]);

  useEffect(() => {
    function resolve(pos: [number, number]) {
      setCenter(pos);
      setPosition(pos);
    }

    if (!("geolocation" in navigator)) {
      resolve(PHNOM_PENH);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      () => resolve(PHNOM_PENH),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [onPositionChange]);

  // The effect above reports whenever the position changes, so this only has
  // to record it.
  const handleChange = useCallback((pos: [number, number]) => {
    setPosition(pos);
  }, []);

  if (!center || !position) {
    return <div className="h-full w-full animate-pulse bg-surface" />;
  }

  const allowed = isPickupAllowed(position[0], position[1], roads);

  // Zoomed right in: at a 12 m tolerance the roadside is only targetable up
  // close, so the map opens tight enough to actually hit it.
  return (
    <MapContainer center={center} zoom={17} zoomControl={false} className="h-full w-full">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {TILE_LABEL_URL && <TileLayer url={TILE_LABEL_URL} />}

      {/* No-pickup wash over everything, with a dashed red edge… */}
      <Rectangle
        bounds={NO_PICKUP_BOUNDS}
        pathOptions={{
          color: NO_PICKUP_RED,
          weight: 2,
          dashArray: "8 6",
          opacity: 0.55,
          fillColor: NO_PICKUP_RED,
          fillOpacity: 0.15,
        }}
      />

      {/* …the city ring, inside which the highways are just congested streets… */}
      <Circle
        center={[PHNOM_PENH[0], PHNOM_PENH[1]]}
        radius={CITY_EXCLUSION_KM * 1000}
        pathOptions={{
          color: NO_PICKUP_RED,
          weight: 1.5,
          dashArray: "6 6",
          opacity: 0.5,
          fillColor: NO_PICKUP_RED,
          fillOpacity: 0.08,
        }}
      />

      {/* …and the corridors punched back in green beyond it. */}
      <RoadCorridors roads={roads} />

      <PinOnLongPress onPin={handleChange} />
      <DraggableMarker position={position} allowed={allowed} onChange={handleChange} />

      <RecenterControl
        target={position}
        zoom={17}
        label="Recenter to my pin"
        bottomOffset={bottomInset + 84}
      />
    </MapContainer>
  );
}
