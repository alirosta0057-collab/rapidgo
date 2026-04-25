"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  type Locale,
  translate as rawTranslate,
} from "./messages";

type Ctx = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      rawTranslate(locale, key, vars),
    [locale]
  );

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      t: (key, vars) => rawTranslate(DEFAULT_LOCALE, key, vars),
      setLocale: () => {},
    };
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
