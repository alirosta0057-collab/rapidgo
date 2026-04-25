import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { getDirection, getLocale, getT } from "@/i18n/server";

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    title: process.env.NEXT_PUBLIC_SITE_NAME || t("app.name"),
    description: t("app.tagline"),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const direction = getDirection(locale);
  const { t } = getT();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || t("app.name");
  return (
    <html lang={locale} dir={direction}>
      <head>
        {locale === "fa" && (
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          />
        )}
      </head>
      <body>
        <Providers locale={locale}>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {siteName} — {t("app.copyright")}
          </footer>
        </Providers>
      </body>
    </html>
  );
}
