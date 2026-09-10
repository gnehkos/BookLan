"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { en, km, type TranslationKey } from "@/lib/i18n/dictionary";

export type Language = "en" | "km";

const STORAGE_KEY = "booklan_language";
const DICTIONARIES: Record<Language, Record<string, string>> = { en, km };

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

type LanguageValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageValue | null>(null);

/**
 * Language state for the whole app.
 *
 * The choice is read from localStorage on mount rather than during render:
 * the server has no way to know it, so rendering Khmer on the first pass would
 * not match what the server sent and React would discard the tree. English is
 * rendered first and swapped immediately after hydration.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "km" || stored === "en") setLanguageState(stored);
  }, []);

  // Screen readers and font fallback both key off this.
  useEffect(() => {
    document.documentElement.lang = language === "km" ? "km" : "en";
    document.documentElement.dataset.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice simply will not survive a reload.
    }
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => {
      // Fall back through English to the key itself, so a missing translation
      // shows something readable rather than a blank.
      let text = DICTIONARIES[language][key] ?? en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguageContext() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useT must be used inside LanguageProvider");
  return value;
}

/** The translate function on its own, which is what most components want. */
export function useT(): Translate {
  return useLanguageContext().t;
}

/** The current language and a setter, for the Profile toggle. */
export function useLanguage() {
  const { language, setLanguage } = useLanguageContext();
  return { language, setLanguage };
}

/**
 * National road names for display, e.g. "National Road 6" -> "ផ្លូវជាតិលេខ ៦".
 *
 * The corridor data keeps the English name because it is what the pickup rules
 * and the seed are written against; this maps it at the point of display, and
 * uses Khmer numerals, which is how the roads are actually written.
 */
export function useRoadName(): (road: { id: string; name: string }) => string {
  const { language } = useLanguageContext();
  return useCallback(
    (road) => (language === "en" ? road.name : km[`road.${road.id}` as TranslationKey] ?? road.name),
    [language]
  );
}

/**
 * Province names for display.
 *
 * The database stores them in English — `Siem Reap`, `Kampot` — and searching,
 * schedules and stations all match on that spelling, so the data keeps it.
 * This maps a stored name onto its Khmer form only at the point it is shown,
 * and returns the original unchanged for anything not in the dictionary.
 */
export function useProvinceName(): (name: string | null | undefined) => string {
  const { language, t } = useLanguageContext();

  return useCallback(
    (name) => {
      if (!name) return "";
      if (language === "en") return name;
      const key = `province.${name.replace(/\s+/g, "")}` as TranslationKey;
      const translated = km[key];
      return translated ?? name;
    },
    [language, t]
  );
}
