/**
 * Presentation-only company details for the bus detail screen.
 *
 * The `companies` table only stores a name and vehicle type — there are no
 * rating, amenity, photo or review columns — so this is demo content keyed off
 * the company name and kept stable per company. Replace with real columns
 * before these numbers are shown to actual passengers.
 */

export type Amenity = { label: string; colorClass: string };

export type CompanyProfile = {
  rating: number;
  tripCount: string;
  amenities: Amenity[];
  reviews: { author: string; stars: number; text: string }[];
  policies: string[];
};

const AMENITIES: Amenity[] = [
  { label: "AC", colorClass: "text-secondary" },
  { label: "WiFi", colorClass: "text-success" },
  { label: "USB", colorClass: "text-warning" },
  { label: "Water", colorClass: "text-primary" },
];

const POLICIES = [
  "Free cancellation up to 1 hour before departure (10% fee after)",
  "1 large luggage + 1 carry-on included per seat",
  "No smoking on board · Pets not allowed",
];

const REVIEW_POOL = [
  { author: "Sochary", stars: 5, text: "Very clean bus and the driver was on time. Comfortable ride!" },
  { author: "Dara", stars: 4, text: "Good AC and WiFi worked most of the way. Recommend." },
  { author: "Sreyneang", stars: 5, text: "Driver picked me up right where I dropped the pin. Easy." },
  { author: "Vuthy", stars: 4, text: "Seats were comfortable, arrived about 15 minutes early." },
];

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function companyProfile(companyName: string): CompanyProfile {
  const seed = hash(companyName || "BookLan");
  // 4.3 – 4.9, stable per company.
  const rating = 4.3 + ((seed % 7) / 10);
  const tripCount = `${1 + (seed % 9)}.${(seed >> 3) % 10}k`;
  const start = seed % REVIEW_POOL.length;

  return {
    rating: Math.round(rating * 10) / 10,
    tripCount,
    amenities: AMENITIES,
    reviews: [REVIEW_POOL[start], REVIEW_POOL[(start + 1) % REVIEW_POOL.length]],
    policies: POLICIES,
  };
}
