"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "./CartProvider";
import { useT } from "@/i18n/client";
import { LocaleSwitcher } from "@/i18n/LocaleSwitcher";

export function Header() {
  const { data: session } = useSession();
  const { items } = useCart();
  const t = useT();
  const role = session?.user?.role;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-700">
          {process.env.NEXT_PUBLIC_SITE_NAME || t("app.name")}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="hover:text-brand-700">{t("header.home")}</Link>
          <Link href="/festivals" className="hover:text-brand-700">{t("header.festivals")}</Link>
          <Link href="/cart" className="relative hover:text-brand-700">
            {t("header.cart")}
            {totalQty > 0 && (
              <span className="absolute -top-2 -left-3 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">
                {totalQty}
              </span>
            )}
          </Link>
          {role === "ADMIN" && (
            <Link href="/admin" className="text-brand-700 hover:underline">{t("header.admin_panel")}</Link>
          )}
          {role === "RESTAURANT" && (
            <Link href="/restaurant" className="text-brand-700 hover:underline">{t("header.restaurant_panel")}</Link>
          )}
          {role === "COURIER" && (
            <Link href="/courier" className="text-brand-700 hover:underline">{t("header.courier_panel")}</Link>
          )}
          {session ? (
            <>
              <Link href="/orders" className="hover:text-brand-700">{t("header.my_orders")}</Link>
              <span className="text-gray-500">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 hover:underline"
              >
                {t("header.sign_out")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline px-3 py-1.5">{t("header.sign_in")}</Link>
              <Link href="/register" className="btn-primary px-3 py-1.5">{t("header.sign_up")}</Link>
            </>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
