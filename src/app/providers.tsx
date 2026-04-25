"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/components/CartProvider";
import { LocaleProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/messages";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <SessionProvider>
      <LocaleProvider locale={locale}>
        <CartProvider>{children}</CartProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
