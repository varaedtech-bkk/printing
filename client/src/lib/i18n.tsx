import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";
import en from "../../../locales/en.json";
import th from "../../../locales/th.json";

type LocaleCode = "en" | "th";
type Translations = typeof en;

type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getByPath(object: any, keyPath: unknown) {
  if (typeof keyPath !== "string" || !keyPath) return undefined;
  return keyPath.split(".").reduce((acc: any, key: string) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
}

function interpolate(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : ""));
}

const locales: Record<LocaleCode, Translations> = { en, th } as const;

export function I18nProvider({ children, defaultLocale = "en" as LocaleCode }: { children: ReactNode; defaultLocale?: LocaleCode }) {
  const [locale, setLocale] = useState<LocaleCode>(defaultLocale);

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const primary = getByPath(locales[locale], key);
      if (primary !== undefined) return typeof primary === "string" ? interpolate(primary, vars) : String(primary);
      const fallback = getByPath(locales.en, key);
      if (fallback !== undefined) return typeof fallback === "string" ? interpolate(fallback, vars) : String(fallback);
      return key;
    };
  }, [locale]);

  const value: I18nContextValue = { locale, setLocale, t };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback for environments rendering outside the provider (e.g., tests, plugins)
    const fallback: I18nContextValue = {
      locale: "en",
      setLocale: () => {},
      t: (key: string, vars?: Record<string, string | number>) => {
        const value = getByPath(locales.en, key);
        return typeof value === "string" ? interpolate(value, vars) : (value !== undefined ? String(value) : key);
      },
    };
    return fallback;
  }
  return ctx;
}


