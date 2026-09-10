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
// Notes are translation keys — this module cannot call a hook, so the
// search screen translates them where it renders them.
export const PROVINCES: { name: string; noteKey: string }[] = [
  { name: "Banteay Meanchey", noteKey: "prov.banteayMeanchey.note" },
  { name: "Battambang", noteKey: "prov.battambang.note" },
  { name: "Kampong Cham", noteKey: "prov.kampongCham.note" },
  { name: "Kampong Chhnang", noteKey: "prov.kampongChhnang.note" },
  { name: "Kampong Speu", noteKey: "prov.kampongSpeu.note" },
  { name: "Kampong Thom", noteKey: "prov.kampongThom.note" },
  { name: "Kampot", noteKey: "prov.kampot.note" },
  { name: "Kandal", noteKey: "prov.kandal.note" },
  { name: "Kep", noteKey: "prov.kep.note" },
  { name: "Koh Kong", noteKey: "prov.kohKong.note" },
  { name: "Kratie", noteKey: "prov.kratie.note" },
  { name: "Mondulkiri", noteKey: "prov.mondulkiri.note" },
  { name: "Oddar Meanchey", noteKey: "prov.oddarMeanchey.note" },
  { name: "Pailin", noteKey: "prov.pailin.note" },
  { name: "Phnom Penh", noteKey: "prov.phnomPenh.note" },
  { name: "Preah Vihear", noteKey: "prov.preahVihear.note" },
  { name: "Prey Veng", noteKey: "prov.preyVeng.note" },
  { name: "Pursat", noteKey: "prov.pursat.note" },
  { name: "Ratanakiri", noteKey: "prov.ratanakiri.note" },
  { name: "Siem Reap", noteKey: "prov.siemReap.note" },
  { name: "Sihanoukville", noteKey: "prov.sihanoukville.note" },
  { name: "Stung Treng", noteKey: "prov.stungTreng.note" },
  { name: "Svay Rieng", noteKey: "prov.svayRieng.note" },
  { name: "Takeo", noteKey: "prov.takeo.note" },
  { name: "Tbong Khmum", noteKey: "prov.tbongKhmum.note" },
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
