export const SERVICE_FEE_USD = 0.5;
export const AVG_SPEED_KMH = 40;
export const PHNOM_PENH: [number, number] = [11.5564, 104.9282];
export const CITIES = ["Phnom Penh", "Siem Reap", "Kampot", "Sihanoukville", "Battambang"] as const;

/**
 * Departure stations for passengers boarding inside Phnom Penh, where there is
 * no national road to flag a bus down on. The `stations` table only holds
 * drop-off points in destination provinces, so these live in code — move them
 * into `stations` (province 'Phnom Penh') if they ever need to be editable.
 */
export type DepartureStation = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export const PHNOM_PENH_DEPARTURE_STATIONS: DepartureStation[] = [
  {
    id: "pp-central",
    name: "Phnom Penh Central Station",
    address: "St 106, near Central Market, Doun Penh",
    lat: 11.5695,
    lng: 104.916,
  },
  {
    id: "pp-night-market",
    name: "Night Market Terminal",
    address: "Sisowath Quay, Doun Penh",
    lat: 11.572,
    lng: 104.923,
  },
  {
    id: "pp-olympic",
    name: "Olympic Stadium Pickup Point",
    address: "Monireth Blvd, Prampi Makara",
    lat: 11.551,
    lng: 104.918,
  },
  {
    id: "pp-chbar-ampov",
    name: "Chbar Ampov Station",
    address: "National Road 1, Chbar Ampov",
    lat: 11.5285,
    lng: 104.9535,
  },
];
