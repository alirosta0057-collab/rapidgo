import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  type Locale,
  isLocale,
  translate as rawTranslate,
} from "./messages";

export const LOCALE_COOKIE = "locale";

const FA_COUNTRIES = new Set(["IR"]);

/**
 * Server-side locale resolver.
 *
 * Resolution order:
 *  1. `locale` cookie (set by LocaleSwitcher).
 *  2. Vercel edge geo header `x-vercel-ip-country` — IR -> fa.
 *  3. `accept-language` header — `fa*` -> fa.
 *  4. DEFAULT_LOCALE (en).
 */
export function getLocale(): Locale {
  const c = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;

  const h = headers();
  const country = h.get("x-vercel-ip-country");
  if (country && FA_COUNTRIES.has(country.toUpperCase())) return "fa";

  const al = h.get("accept-language");
  if (al && /\bfa\b/i.test(al)) return "fa";

  return DEFAULT_LOCALE;
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

export function getT() {
  const locale = getLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      rawTranslate(locale, key, vars),
  };
}

export { rawTranslate as translate };
