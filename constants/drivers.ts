/**
 * Driver identities.
 *
 * The schema has no drivers table — `active_trips` links to a company, not a
 * person — so a name is derived deterministically from the booking id. The
 * same booking always shows the same driver, and the avatar shown alongside is
 * the operator's logo (see CompanyLogo), which is what a passenger recognises.
 */
const DRIVER_NAMES = [
  "Sok Dara",
  "Chan Vuthy",
  "Kim Sophea",
  "Long Piseth",
  "Meas Ratana",
  "Nou Samnang",
  "Prak Chenda",
  "Ros Vichea",
  "Sam Bunthoeun",
  "Tep Rithy",
] as const;

/** Demo contact number — the schema has no driver phone column. */
export const DRIVER_PHONE = "+85512345678";

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function driverNameFor(bookingId: string) {
  return DRIVER_NAMES[hash(bookingId || "booklan") % DRIVER_NAMES.length];
}
