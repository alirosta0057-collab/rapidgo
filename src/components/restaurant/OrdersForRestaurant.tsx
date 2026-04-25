"use client";

import { ORDER_STATUS_KEY, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import { useLocale } from "@/i18n/client";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  customer: { name: string };
  items: { name: string; quantity: number }[];
};

export function OrdersForRestaurant({ orders }: { orders: Order[] }) {
  const { t, locale } = useLocale();
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-brand-50 text-right">
          <tr>
            <th className="p-3">{t("restaurant_panel.item_id")}</th>
            <th className="p-3">{t("restaurant_panel.customer")}</th>
            <th className="p-3">{t("restaurant_panel.items")}</th>
            <th className="p-3">{t("restaurant_panel.total")}</th>
            <th className="p-3">{t("common.status")}</th>
            <th className="p-3">{t("common.date")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-3 font-mono text-xs">#{o.id.slice(-6)}</td>
              <td className="p-3 text-xs">{o.customer.name}</td>
              <td className="p-3 text-xs">{o.items.map((i) => `${i.name} ×${i.quantity}`).join(" / ")}</td>
              <td className="p-3">{formatToman(o.total, locale)}</td>
              <td className="p-3"><span className="badge bg-brand-50 text-brand-700">{t(ORDER_STATUS_KEY[o.status as OrderStatus])}</span></td>
              <td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleString(dateLocale)}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td className="p-4 text-gray-500" colSpan={6}>{t("restaurant_panel.no_orders")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
