import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_KEY, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import Link from "next/link";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const { t, locale } = getT();
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, restaurant: true },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t("admin.orders_title")}</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">{t("admin.col_id")}</th>
              <th className="p-3">{t("admin.col_customer")}</th>
              <th className="p-3">{t("admin.col_restaurant")}</th>
              <th className="p-3">{t("admin.col_total")}</th>
              <th className="p-3">{t("admin.col_commission")}</th>
              <th className="p-3">{t("admin.col_courier_fee")}</th>
              <th className="p-3">{t("admin.col_status")}</th>
              <th className="p-3">{t("admin.col_date")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/orders/${o.id}`} className="font-mono text-xs text-brand-700 hover:underline">
                    #{o.id.slice(-6)}
                  </Link>
                </td>
                <td className="p-3 text-xs">{o.customer.name}</td>
                <td className="p-3 text-xs">{o.restaurant?.name || t("admin.supermarket")}</td>
                <td className="p-3">{formatToman(o.total, locale)}</td>
                <td className="p-3 text-gray-500">{formatToman(o.commissionFee, locale)}</td>
                <td className="p-3 text-gray-500">{formatToman(o.courierFee, locale)}</td>
                <td className="p-3">
                  <span className="badge bg-brand-50 text-brand-700">{t(ORDER_STATUS_KEY[o.status as OrderStatus])}</span>
                </td>
                <td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleString(dateLocale)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={8}>{t("admin.no_orders")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
