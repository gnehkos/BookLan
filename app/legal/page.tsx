"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, FileText, Lock, MapPin, Share2, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

/** Shown in both documents so it is obvious which version was agreed to. */
const LAST_UPDATED = "1 September 2026";

type Section = { heading: string; body: string[] };

const TERMS: Section[] = [
  {
    heading: "1. What BookLan is",
    body: [
      "BookLan is a booking platform. It lets you reserve a seat on an intercity bus or van and be collected from the roadside instead of a terminal.",
      "We do not own or operate any vehicle. Every journey is run by an independent bus company listed in the app, and that company remains responsible for the vehicle, the driver, and the journey itself. Your travel contract is with them; your contract with us covers the booking.",
    ],
  },
  {
    heading: "2. Your account",
    body: [
      "You need a phone number to use BookLan, because a driver has to be able to reach you when they arrive. Keep it accurate — a booking made against a number that cannot be reached may be cancelled by the driver.",
      "You are responsible for what happens under your account. One person, one account: do not book on behalf of someone the driver will not be able to identify from the ticket.",
    ],
  },
  {
    heading: "3. Bookings and pickup points",
    body: [
      "A pickup point must sit on a national road that serves your destination, and outside the 20 km city zone around Phnom Penh. These limits exist because a coach cannot leave its route or stop on a congested city street.",
      "You may hold one active roadside pickup at a time. Advance bookings for future dates are not limited in this way.",
      "Be at your pin before the arrival time shown. Drivers wait briefly but are carrying other passengers and cannot hold the coach. A driver who cannot find you at the pin may mark the pickup as missed.",
    ],
  },
  {
    heading: "4. Fares and payment",
    body: [
      "The fare shown before you pay is the total for your booking, including every seat you selected. There are no charges added afterwards.",
      "Payment is taken at the time of booking. Seats are only held once payment succeeds — a failed payment never reserves a seat, and any amount taken on a failed attempt is released by your bank.",
    ],
  },
  {
    heading: "5. Cancellations and refunds",
    body: [
      "You can cancel from the tracking screen at any time before the driver approves your pickup. Your seats return to the pool immediately.",
      "Refunds go back to the card or wallet used, and normally appear within three to five working days. Once the driver has approved your pickup the journey has begun and the fare is no longer refundable.",
      "If an operator cancels a service, you are refunded in full.",
    ],
  },
  {
    heading: "6. Conduct",
    body: [
      "Follow the operator's rules on board. Drivers may refuse to carry anyone who is abusive, intoxicated, or who cannot produce a valid Ticket ID.",
      "Do not use BookLan to arrange anything unlawful, and do not misuse the in-app call and message features, which exist so you and your driver can coordinate a pickup.",
    ],
  },
  {
    heading: "7. Liability",
    body: [
      "We are responsible for the booking service: taking your payment, holding your seat, and passing your pickup details to the operator correctly.",
      "We are not responsible for the operation of the journey — delays, road conditions, vehicle condition, or the conduct of a driver are matters for the operator, though we will help you raise them.",
      "Nothing here removes any right you have under Cambodian consumer law.",
    ],
  },
  {
    heading: "8. Changes",
    body: [
      "If we change these terms we will show you the new version in the app before your next booking. Continuing to book after that means you accept them.",
    ],
  },
];

const PRIVACY: Section[] = [
  {
    heading: "What we collect",
    body: [
      "Your name, phone number, and profile photo if you add one. Your name and number are shared with the driver of a trip you have booked so they can find and contact you.",
      "Your bookings: routes, seats, ticket IDs, fares, and their status.",
      "Your pickup location — the point you pin, and your device location while you are being tracked to a pickup.",
    ],
  },
  {
    heading: "What we do not collect",
    body: [
      "We do not store your card details. Payments are handled by our payment provider, and the app never sees the full card number.",
      "We do not track your location in the background. Location is read while you are pinning a pickup or watching a bus approach, and not otherwise.",
    ],
  },
  {
    heading: "Who sees it",
    body: [
      "The operator of a trip you have booked sees your name, phone number, seat numbers, and pickup point — the details needed to collect you.",
      "Other passengers see nothing about you. We do not sell personal data, and we do not share it for advertising.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "Booking records are kept for three years, which covers refunds, disputes, and the operators' own accounting obligations.",
      "Pickup locations are kept with the booking they belong to and are not used to build a movement history.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can edit your name, phone number, and photo at any time from the Profile screen.",
      "You can ask us to delete your account and personal data by contacting support. Completed booking records may be retained where an operator or the law requires it, with your details removed.",
    ],
  },
];

const PRIVACY_ICONS = [Eye, Lock, Share2, FileText, Trash2];

export default function LegalPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-col pb-32">
        <div className="flex items-center gap-3 px-4 pb-4 pt-6">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-text-primary">
            Terms and Privacy
          </h1>
        </div>

        <div className="mx-4 flex gap-1 rounded-pill bg-white p-1 shadow-[var(--shadow-soft)]">
          {(
            [
              { key: "terms", label: "Terms of Service" },
              { key: "privacy", label: "Privacy" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-9 flex-1 rounded-pill text-[13px] font-bold transition-colors ${
                tab === key ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="px-5 pb-1 pt-4 text-[11.5px] text-text-muted">Last updated {LAST_UPDATED}</p>

        {tab === "terms" ? (
          <div className="mx-4 mt-2 flex flex-col gap-3">
            {TERMS.map((section) => (
              <section
                key={section.heading}
                className="rounded-card bg-white p-4 shadow-[var(--shadow-soft)]"
              >
                <h2 className="text-[14px] font-extrabold text-text-primary">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-2 text-[13px] leading-[21px] text-text-secondary"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="mx-4 mt-2 flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-card bg-accent p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary-dark" />
              <p className="text-[12.5px] leading-[19px] text-text-secondary">
                The short version: we collect what a driver needs to find you, share it only with
                the operator of the trip you booked, and read your location only while you are
                actually using the map.
              </p>
            </div>

            {PRIVACY.map((section, index) => {
              const Icon = PRIVACY_ICONS[index % PRIVACY_ICONS.length];
              return (
                <section
                  key={section.heading}
                  className="rounded-card bg-white p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-secondary-dark">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-[14px] font-extrabold text-text-primary">
                      {section.heading}
                    </h2>
                  </div>
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-2 text-[13px] leading-[21px] text-text-secondary"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              );
            })}
          </div>
        )}

        <p className="px-6 pt-6 text-center text-[11.5px] leading-[18px] text-text-muted">
          Questions about either document? Reach us from Help and Support.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
