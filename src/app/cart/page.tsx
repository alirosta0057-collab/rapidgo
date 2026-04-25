"use client";

import { useCart } from "@/components/CartProvider";
import { formatToman } from "@/lib/money";
import Link from "next/link";
import { useLocale } from "@/i18n/client";

export default function CartPage() {
  const { items, setQuantity, remove, itemsTotal, clear } = useCart();
  const { t, locale } = useLocale();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{t("cart.title")}</h1>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          {t("cart.empty")}{" "}
          <Link href="/" className="text-brand-700 hover:underline">{t("cart.start_shopping")}</Link>
        </div>
      ) : (
        <>
          <div className="card divide-y">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-500">{formatToman(it.unitPrice, locale)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-outline px-2 py-1" onClick={() => setQuantity(it.id, it.quantity - 1)}>-</button>
                  <span className="w-6 text-center">{it.quantity}</span>
                  <button className="btn-outline px-2 py-1" onClick={() => setQuantity(it.id, it.quantity + 1)}>+</button>
                </div>
                <div className="w-24 text-left font-semibold">{formatToman(it.unitPrice * it.quantity, locale)}</div>
                <button className="text-sm text-red-600 hover:underline" onClick={() => remove(it.id)}>{t("common.delete")}</button>
              </div>
            ))}
          </div>

          <div className="card flex items-center justify-between p-4">
            <span className="text-lg">{t("cart.items_total")}</span>
            <span className="text-lg font-bold">{formatToman(itemsTotal, locale)}</span>
          </div>

          <div className="flex justify-between gap-3">
            <button className="btn-outline" onClick={clear}>{t("cart.clear_cart")}</button>
            <Link href="/checkout" className="btn-primary">{t("cart.continue_to_checkout")}</Link>
          </div>
        </>
      )}
    </div>
  );
}
