"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, FileText, Lock, MapPin, Share2, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** Shown in both documents so it is obvious which version was agreed to. */
const LAST_UPDATED = "1 September 2026";

type Section = { headingKey: TranslationKey; bodyKeys: TranslationKey[] };

const TERMS: Section[] = [
  {
    headingKey: "terms.1.h",
    bodyKeys: [
      "terms.1.a",
      "terms.1.b",
    ],
  },
  {
    headingKey: "terms.2.h",
    bodyKeys: [
      "terms.2.a",
      "terms.2.b",
    ],
  },
  {
    headingKey: "terms.3.h",
    bodyKeys: [
      "terms.3.a",
      "terms.3.b",
      "terms.3.c",
    ],
  },
  {
    headingKey: "terms.4.h",
    bodyKeys: [
      "terms.4.a",
      "terms.4.b",
    ],
  },
  {
    headingKey: "terms.5.h",
    bodyKeys: [
      "terms.5.a",
      "terms.5.b",
      "terms.5.c",
    ],
  },
  {
    headingKey: "terms.6.h",
    bodyKeys: [
      "terms.6.a",
      "terms.6.b",
    ],
  },
  {
    headingKey: "terms.7.h",
    bodyKeys: [
      "terms.7.a",
      "terms.7.b",
      "terms.7.c",
    ],
  },
  {
    headingKey: "terms.8.h",
    bodyKeys: [
      "terms.8.a",
    ],
  },
];

const PRIVACY: Section[] = [
  {
    headingKey: "privacy.1.h",
    bodyKeys: [
      "privacy.1.a",
      "privacy.1.b",
      "privacy.1.c",
    ],
  },
  {
    headingKey: "privacy.2.h",
    bodyKeys: [
      "privacy.2.a",
      "privacy.2.b",
    ],
  },
  {
    headingKey: "privacy.3.h",
    bodyKeys: [
      "privacy.3.a",
      "privacy.3.b",
    ],
  },
  {
    headingKey: "privacy.4.h",
    bodyKeys: [
      "privacy.4.a",
      "privacy.4.b",
    ],
  },
  {
    headingKey: "privacy.5.h",
    bodyKeys: [
      "privacy.5.a",
      "privacy.5.b",
    ],
  },
];

const PRIVACY_ICONS = [Eye, Lock, Share2, FileText, Trash2];

export default function LegalPage() {
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<"terms" | "privacy">("terms");

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
          {t("profile.termsPrivacy")}
          </h1>
        </div>

        <div className="mx-4 flex gap-1 rounded-pill bg-white p-1 shadow-[var(--shadow-soft)]">
          {(
            [
              { key: "terms", labelKey: "legal.tabTerms" as const },
              { key: "privacy", labelKey: "legal.tabPrivacy" as const },
            ] as const
          ).map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-9 flex-1 rounded-pill text-[13px] font-bold transition-colors ${
                tab === key ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <p className="px-5 pb-1 pt-4 text-[11.5px] text-text-muted">{t("legal.lastUpdated", { date: LAST_UPDATED })}</p>

        {tab === "terms" ? (
          <div className="mx-4 mt-2 flex flex-col gap-3">
            {TERMS.map((section) => (
              <section
                key={section.headingKey}
                className="rounded-card bg-white p-4 shadow-[var(--shadow-soft)]"
              >
                <h2 className="text-[14px] font-extrabold text-text-primary">{t(section.headingKey)}</h2>
                {section.bodyKeys.map((bodyKey) => (
                  <p key={bodyKey} className="mt-2 text-[13px] leading-[21px] text-text-secondary">
                    {t(bodyKey)}
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
          {t("privacy.summary")}
          </p>
            </div>

            {PRIVACY.map((section, index) => {
              const Icon = PRIVACY_ICONS[index % PRIVACY_ICONS.length];
              return (
                <section
                  key={section.headingKey}
                  className="rounded-card bg-white p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-secondary-dark">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-[14px] font-extrabold text-text-primary">
                      {t(section.headingKey)}
                    </h2>
                  </div>
                  {section.bodyKeys.map((bodyKey) => (
                    <p key={bodyKey} className="mt-2 text-[13px] leading-[21px] text-text-secondary">
                      {t(bodyKey)}
                    </p>
                  ))}
                </section>
              );
            })}
          </div>
        )}

        <p className="px-6 pt-6 text-center text-[11.5px] leading-[18px] text-text-muted">
          {t("legal.footer")}
          </p>
      </div>

    </div>
  );
}
