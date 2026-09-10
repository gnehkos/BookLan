"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
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

const FAQS: { questionKey: TranslationKey; answerKey: TranslationKey }[] = [
  {
    questionKey: "faq.1.q",
    answerKey: "faq.1.a",
  },
  {
    questionKey: "faq.2.q",
    answerKey: "faq.2.a",
  },
  {
    questionKey: "faq.3.q",
    answerKey: "faq.3.a",
  },
  {
    questionKey: "faq.4.q",
    answerKey: "faq.4.a",
  },
  {
    questionKey: "faq.5.q",
    answerKey: "faq.5.a",
  },
  {
    questionKey: "faq.6.q",
    answerKey: "faq.6.a",
  },
  {
    questionKey: "faq.7.q",
    answerKey: "faq.7.a",
  },
  {
    questionKey: "faq.8.q",
    answerKey: "faq.8.a",
  },
];

function Faq({ questionKey, answerKey }: { questionKey: TranslationKey; answerKey: TranslationKey }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="flex-1 text-[14px] font-semibold leading-snug text-text-primary">
          {t(questionKey)}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-[13.5px] leading-[22px] text-text-secondary">{t(answerKey)}</p>
      )}
    </div>
  );
}

function TopicCard({
  icon,
  titleKey,
  bodyKey,
}: {
  icon: React.ReactNode;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-[var(--shadow-soft)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-secondary-dark">
        {icon}
      </span>
      <span className="text-[13.5px] font-bold text-text-primary">{t(titleKey)}</span>
      <span className="text-[12px] leading-[18px] text-text-secondary">{t(bodyKey)}</span>
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const t = useT();

  return (
    <div className="flex min-h-screen justify-center bg-surface">
      <div className="flex w-full max-w-[393px] flex-col pb-32">
        <div className="flex items-center gap-3 px-4 pb-4 pt-6">
          <button
            onClick={() => router.back()}
            aria-label={t("common.back")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-text-primary" />
          </button>
          <h1 className="text-[20px] font-extrabold tracking-[-0.4px] text-text-primary">
          {t("profile.helpSupport")}
          </h1>
        </div>

        {/* Contact card — the one thing someone in trouble is looking for. */}
        <div className="mx-4 overflow-hidden rounded-card bg-gradient-to-br from-primary to-primary-dark p-5 shadow-[var(--shadow-float)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12">
            <LifeBuoy className="h-5 w-5 text-white" />
          </span>
          <p className="mt-3 text-[16px] font-bold text-white">{t("support.stuck")}</p>
          <p className="mt-1 text-[13px] leading-[20px] text-white/70">
          {t("support.stuckBody")}
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-white/10 px-4 py-3">
            <Phone className="h-4 w-4 shrink-0 text-white/80" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-mono text-[15px] font-semibold text-white">
                {SUPPORT_PHONE}
              </span>
              <span className="text-[11.5px] text-white/55">{t("support.hours")}</span>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <TopicCard
            icon={<MapPin className="h-4 w-4" />}
            titleKey="support.topicPickup"
            bodyKey="support.topicPickupBody"
          />
          <TopicCard
            icon={<Ticket className="h-4 w-4" />}
            titleKey="support.topicTickets"
            bodyKey="support.topicTicketsBody"
          />
          <TopicCard
            icon={<CreditCard className="h-4 w-4" />}
            titleKey="support.topicPayments"
            bodyKey="support.topicPaymentsBody"
          />
          <TopicCard
            icon={<MessageSquare className="h-4 w-4" />}
            titleKey="support.topicDriver"
            bodyKey="support.topicDriverBody"
          />
        </div>

        <h2 className="px-5 pb-2 pt-7 text-[12px] font-bold tracking-[0.5px] text-text-secondary">
          {t("support.commonQuestions")}
          </h2>
        <div className="mx-4 rounded-card bg-white px-4 shadow-[var(--shadow-soft)]">
          {FAQS.map((faq) => (
            <Faq key={faq.questionKey} {...faq} />
          ))}
        </div>

        <p className="px-6 pt-6 text-center text-[11.5px] leading-[18px] text-text-muted">
          {t("support.disclaimer")}
          </p>
      </div>

    </div>
  );
}
