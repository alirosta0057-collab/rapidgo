import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCommissions() {
  const { t, locale } = getT();
  const orders = await prisma.order.findMany({
    where: { status: { in: ["DELIVERED", "ON_THE_WAY", "PREPARING", "ACCEPTED", "PAID"] } },
    orderBy: { createdAt: "desc" },
    include: { restaurant: true },
    take: 100,
  });

  const totals = orders.reduce(
    (acc, o) => {
      acc.commission += o.commissionFee;
      acc.courierFee += o.courierFee;
      acc.gross += o.itemsTotal;
      return acc;
    },
    { commission: 0, courierFee: 0, gross: 0 }
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.commissions_title")}</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-gray-500">{t("admin.sum_gross_items")}</div>
          <div className="mt-1 text-xl font-bold">{formatToman(totals.gross, locale)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">{t("admin.sum_commission")}</div>
          <div className="mt-1 text-xl font-bold text-brand-700">{formatToman(totals.commission, locale)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">{t("admin.sum_courier_fee")}</div>
          <div className="mt-1 text-xl font-bold">{formatToman(totals.courierFee, locale)}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">{t("admin.col_order")}</th>
              <th className="p-3">{t("admin.col_restaurant")}</th>
              <th className="p-3">{t("admin.col_items_total")}</th>
              <th className="p-3">{t("admin.col_rate")}</th>
              <th className="p-3">{t("admin.col_commission")}</th>
              <th className="p-3">{t("admin.col_courier_fee")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono text-xs">#{o.id.slice(-6)}</td>
                <td className="p-3 text-xs">{o.restaurant?.name || t("admin.supermarket")}</td>
                <td className="p-3">{formatToman(o.itemsTotal, locale)}</td>
                <td className="p-3 text-gray-500">{(o.commissionRate * 100).toFixed(0)}%</td>
                <td className="p-3 text-brand-700">{formatToman(o.commissionFee, locale)}</td>
                <td className="p-3">{formatToman(o.courierFee, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
