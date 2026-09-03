export const SERVICE_FEE_USD = 0.5;
export const AVG_SPEED_KMH = 40;
export const PHNOM_PENH: [number, number] = [11.5564, 104.9282];
/**
 * Every Cambodian province, plus the capital. Used for the Plan Trip origin and
 * destination pickers, and as the search index on the roadside flow — someone
 * can look up anywhere in the country, not only the busy routes.
 */
export const CITIES = [
  "Banteay Meanchey",
  "Battambang",
  "Kampong Cham",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kampot",
  "Kandal",
  "Kep",
  "Koh Kong",
  "Kratie",
  "Mondulkiri",
  "Oddar Meanchey",
  "Pailin",
  "Phnom Penh",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Siem Reap",
  "Sihanoukville",
  "Stung Treng",
  "Svay Rieng",
  "Takeo",
  "Tbong Khmum",
] as const;

/**
 * The same list with a line of description, which is what the search results
 * show. Kept beside CITIES so the two cannot drift apart.
 */
export const PROVINCES: { name: string; note: string }[] = [
  { name: "Banteay Meanchey", note: "Poipet and the Thai border" },
  { name: "Battambang", note: "Colonial streets, rice country" },
  { name: "Kampong Cham", note: "Mekong riverside town" },
  { name: "Kampong Chhnang", note: "Floating villages on the Tonle Sap" },
  { name: "Kampong Speu", note: "Kirirom pines and palm sugar" },
  { name: "Kampong Thom", note: "Sambor Prei Kuk temples" },
  { name: "Kampot", note: "Riverside and pepper farms" },
  { name: "Kandal", note: "Ringing Phnom Penh, silk island" },
  { name: "Kep", note: "Crab market and the coast" },
  { name: "Koh Kong", note: "Mangroves and the Cardamoms" },
  { name: "Kratie", note: "Mekong river dolphins" },
  { name: "Mondulkiri", note: "Highlands, waterfalls, elephants" },
  { name: "Oddar Meanchey", note: "Northern border, Preah Vihear road" },
  { name: "Pailin", note: "Gem country on the Thai border" },
  { name: "Phnom Penh", note: "The capital" },
  { name: "Preah Vihear", note: "Cliff-top temple on the escarpment" },
  { name: "Prey Veng", note: "Southeast farmland" },
  { name: "Pursat", note: "Gateway to the Cardamom range" },
  { name: "Ratanakiri", note: "Crater lake and red earth roads" },
  { name: "Siem Reap", note: "Angkor Wat and the temples" },
  { name: "Sihanoukville", note: "Beaches and the islands" },
  { name: "Stung Treng", note: "Mekong rapids near the Lao border" },
  { name: "Svay Rieng", note: "Southeast, toward the border" },
  { name: "Takeo", note: "Temple country, south" },
  { name: "Tbong Khmum", note: "Rubber plantations east of the Mekong" },
];

/**
 * What the search screen offers before anything is typed, ordered by how often
 * people actually travel there. Everything else is still reachable by typing.
 */
export const POPULAR_DESTINATION_NAMES = [
  "Siem Reap",
  "Sihanoukville",
  "Battambang",
  "Kampot",
  "Kep",
  "Kampong Cham",
  "Svay Rieng",
  "Prey Veng",
  "Takeo",
  "Kratie",
] as const;

export const POPULAR_DESTINATIONS = POPULAR_DESTINATION_NAMES.map(
  (name) => PROVINCES.find((province) => province.name === name)!
);

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
