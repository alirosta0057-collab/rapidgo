"use client";

import { useLocale } from "./client";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === "fa" ? "en" : "fa";
  const label = next === "fa" ? "فارسی" : "EN";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={
        "text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 " +
        className
      }
      aria-label={`Switch language to ${label}`}
    >
      {label}
    </button>
  );
}
