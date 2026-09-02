"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Phone,
  Ticket,
} from "lucide-react";

/** Support line and hours, shown on the contact card. */
const SUPPORT_PHONE = "+855 23 900 100";
const SUPPORT_HOURS = "Every day, 6:00–22:00";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How do I get picked up without going to a station?",
    answer:
      "Choose where you are going, then drop a pin on the national road that serves it. Buses already running that route will show you as a waiting passenger, and the one you book stops for you at your pin. You need to be standing at the roadside itself — the driver cannot turn off the highway to collect you.",
  },
  {
    question: "Why can't I pin my pickup where I want?",
    answer:
      "Two rules limit it. The pin has to sit on a national road that actually serves your destination — a bus to Siem Reap runs National Road 6 and will never pass someone waiting on National Road 2. And pickups do not run within 20 km of the middle of Phnom Penh, because inside the city those roads are ordinary congested streets a coach cannot pull over on.",
  },
  {
    question: "How early should I be at my pickup point?",
    answer:
      "Be at the roadside by the time the tracking screen says the bus is five minutes away. Drivers wait briefly, but they are carrying passengers who booked ahead and cannot hold up the whole coach.",
  },
  {
    question: "What happens when the bus reaches me?",
    answer:
      "Show your Ticket ID to the driver. They check it against their manifest and approve the pickup in their own app, at which point your screen switches to the on-trip view. Your seat number is on the ticket.",
  },
  {
    question: "Can I book more than one seat?",
    answer:
      "Yes. Pick every seat you want on the seat map before paying, and all of them appear on a single ticket. The fare shown is the total for the whole booking.",
  },
  {
    question: "Can I cancel, and do I get my money back?",
    answer:
      "You can cancel from the tracking screen at any point before the driver approves your pickup, and the seats go straight back into the pool. Refunds are returned to the card or wallet you paid with and usually appear within three to five working days.",
  },
  {
    question: "Why can I only have one pickup booking at a time?",
    answer:
      "A roadside pickup is a live arrangement between you and one driver. Until that trip finishes or is cancelled, a second one would send two buses to two places for the same passenger. Advance bookings for future dates are not affected.",
  },
  {
    question: "My payment failed but I was charged.",
    answer:
      "A failed booking never holds your seats, and any amount taken is released automatically by your bank. If it has not returned within five working days, contact us with the Ticket ID and the date and we will trace it.",
  },
];

function Faq({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="flex-1 text-[14px] font-semibold leading-snug text-text-primary">
          {question}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-[13.5px] leading-[22px] text-text-secondary">{answer}</p>
      )}
    </div>
  );
}

function TopicCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-[var(--shadow-soft)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-secondary-dark">
        {icon}
      </span>
      <span className="text-[13.5px] font-bold text-text-primary">{title}</span>
      <span className="text-[12px] leading-[18px] text-text-secondary">{body}</span>
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();

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
            Help and Support
          </h1>
        </div>

        {/* Contact card — the one thing someone in trouble is looking for. */}
        <div className="mx-4 overflow-hidden rounded-card bg-gradient-to-br from-primary to-primary-dark p-5 shadow-[var(--shadow-float)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12">
            <LifeBuoy className="h-5 w-5 text-white" />
          </span>
          <p className="mt-3 text-[16px] font-bold text-white">Stuck at the roadside?</p>
          <p className="mt-1 text-[13px] leading-[20px] text-white/70">
            If your bus is late or you cannot find it, call the support line and we will reach the
            driver for you.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-white/10 px-4 py-3">
            <Phone className="h-4 w-4 shrink-0 text-white/80" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-mono text-[15px] font-semibold text-white">
                {SUPPORT_PHONE}
              </span>
              <span className="text-[11.5px] text-white/55">{SUPPORT_HOURS}</span>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <TopicCard
            icon={<MapPin className="h-4 w-4" />}
            title="Pickup points"
            body="Where you can and cannot wait for a bus, and why."
          />
          <TopicCard
            icon={<Ticket className="h-4 w-4" />}
            title="Tickets and seats"
            body="Ticket IDs, seat numbers and boarding."
          />
          <TopicCard
            icon={<CreditCard className="h-4 w-4" />}
            title="Payments"
            body="Fares, receipts and how refunds are returned."
          />
          <TopicCard
            icon={<MessageSquare className="h-4 w-4" />}
            title="Your driver"
            body="Calling or messaging the driver from the app."
          />
        </div>

        <h2 className="px-5 pb-2 pt-7 text-[12px] font-bold tracking-[0.5px] text-text-secondary">
          COMMON QUESTIONS
        </h2>
        <div className="mx-4 rounded-card bg-white px-4 shadow-[var(--shadow-soft)]">
          {FAQS.map((faq) => (
            <Faq key={faq.question} {...faq} />
          ))}
        </div>

        <p className="px-6 pt-6 text-center text-[11.5px] leading-[18px] text-text-muted">
          BookLan is a booking platform. Journeys are operated by the bus companies listed in the
          app, who remain responsible for the vehicle, the driver and the journey itself.
        </p>
      </div>

    </div>
  );
}
