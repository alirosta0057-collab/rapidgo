import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "مارکت سوپر",
  description: "سفارش آنلاین غذا، بهداشتی و سوپرمارکت",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "مارکت سوپر"} — همه حقوق محفوظ است
          </footer>
        </Providers>
      </body>
    </html>
  );
}
