/**
 * Presentation-only company details for the bus detail screen.
 *
 * The `companies` table only stores a name and vehicle type — there are no
 * rating, photo or review columns — so this is demo content keyed off
 * the company name and kept stable per company. Replace with real columns
 * before these numbers are shown to actual passengers.
 */

export type CompanyProfile = {
  rating: number;
  tripCount: string;
  reviews: { author: string; stars: number; textKey: string }[];
  policyKeys: string[];
};

// Keys, not text: this module has no access to a hook, so the screens that
// render these translate them.
const POLICIES = ["policy.1", "policy.2", "policy.3"];

const REVIEW_POOL = [
  { author: "Sochary", stars: 5, textKey: "demoReview.1" },
  { author: "Dara", stars: 4, textKey: "demoReview.2" },
  { author: "Sreyneang", stars: 5, textKey: "demoReview.3" },
  { author: "Vuthy", stars: 4, textKey: "demoReview.4" },
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
    reviews: [REVIEW_POOL[start], REVIEW_POOL[(start + 1) % REVIEW_POOL.length]],
    policyKeys: POLICIES,
  };
}
