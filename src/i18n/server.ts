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
 *  1. `locale` cookie (set by LocaleSwitcher) — explicit user choice always wins.
 *  2. Vercel edge geo header `x-vercel-ip-country` — when present, country is
 *     authoritative: IR -> fa, anything else -> DEFAULT_LOCALE.
 *     We do NOT fall through to accept-language in this case, otherwise a
 *     Persian-language browser in (e.g.) Turkey would incorrectly get fa.
 *  3. `accept-language` header — only used when no country header is present
 *     (e.g. local dev). `fa*` -> fa.
 *  4. DEFAULT_LOCALE (en).
 */
export function getLocale(): Locale {
  const c = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;

  const h = headers();
  const country = h.get("x-vercel-ip-country");
  if (country) {
    return FA_COUNTRIES.has(country.toUpperCase()) ? "fa" : DEFAULT_LOCALE;
  }

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
