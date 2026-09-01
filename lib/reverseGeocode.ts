import { nearestRoad } from "@/lib/geo";

/**
 * Turns pickup coordinates into something a passenger and a driver can both
 * read — "Krong Stueng Saen · National Road 6" rather than "11.5412, 104.8721".
 *
 * Uses OSM Nominatim, whose usage policy caps this at roughly one request per
 * second and asks for an identifying referer (the browser sends one). That's
 * fine here because we resolve a name once, when the pin is confirmed, and
 * store it with the booking — swap in a keyed geocoder before heavy traffic.
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

/** Locality name from a Nominatim address, most specific first. */
function localityFrom(address: Record<string, string> | undefined) {
  if (!address) return null;
  return (
    address.village ??
    address.suburb ??
    address.neighbourhood ??
    address.town ??
    address.city_district ??
    address.city ??
    address.municipality ??
    address.county ??
    address.state ??
    null
  );
}

/** Always returns something usable: never throws, never returns empty. */
export async function describePlace(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string> {
  const road = nearestRoad(lat, lng)?.road.name ?? null;

  try {
    const response = await fetch(
      // accept-language=en so places come back Latinised ("Baray") rather than
      // in Khmer script, matching the rest of the UI.
      `${NOMINATIM_URL}?format=jsonv2&zoom=16&accept-language=en&lat=${lat}&lon=${lng}`,
      { signal, headers: { Accept: "application/json" } }
    );

    if (response.ok) {
      const data = await response.json();
      const address = data?.address as Record<string, string> | undefined;
      const locality = localityFrom(address);
      // Prefer the actual street when Nominatim knows one.
      const street = address?.road ?? road;

      const parts = [locality, street].filter(Boolean);
      if (parts.length > 0) return parts.join(" · ");
      if (typeof data?.display_name === "string" && data.display_name) {
        return data.display_name.split(",").slice(0, 2).join(",").trim();
      }
    }
  } catch {
    // Offline, aborted, or rate-limited — fall through to the road name.
  }

  if (road) return road;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
