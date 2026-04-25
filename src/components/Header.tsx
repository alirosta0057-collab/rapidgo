"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "./CartProvider";

export function Header() {
  const { data: session } = useSession();
  const { items } = useCart();
  const role = session?.user?.role;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-700">
          {process.env.NEXT_PUBLIC_SITE_NAME || "مارکت سوپر"}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="hover:text-brand-700">صفحه اصلی</Link>
          <Link href="/festivals" className="hover:text-brand-700">جشنواره‌ها</Link>
          <Link href="/cart" className="relative hover:text-brand-700">
            سبد خرید
            {totalQty > 0 && (
              <span className="absolute -top-2 -left-3 rounded-full bg-brand-600 px-1.5 text-[10px] text-white">
                {totalQty}
              </span>
            )}
          </Link>
          {role === "ADMIN" && (
            <Link href="/admin" className="text-brand-700 hover:underline">پنل ادمین</Link>
          )}
          {role === "RESTAURANT" && (
            <Link href="/restaurant" className="text-brand-700 hover:underline">پنل رستوران</Link>
          )}
          {role === "COURIER" && (
            <Link href="/courier" className="text-brand-700 hover:underline">پنل پیک</Link>
          )}
          {session ? (
            <>
              <Link href="/orders" className="hover:text-brand-700">سفارش‌های من</Link>
              <span className="text-gray-500">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 hover:underline"
              >
                خروج
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline px-3 py-1.5">ورود</Link>
              <Link href="/register" className="btn-primary px-3 py-1.5">ثبت‌نام</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
