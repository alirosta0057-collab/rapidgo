import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { t, locale } = getT();
  const [users, restaurants, orders, deliveredOrders, ads, festivals] = await Promise.all([
    prisma.user.count(),
    prisma.restaurant.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { commissionFee: true, courierFee: true, total: true },
      where: { status: "DELIVERED" },
    }),
    prisma.ad.count({ where: { isActive: true } }),
    prisma.festival.count({ where: { isActive: true } }),
  ]);

  const stats = [
    { label: t("admin.stat_users"), value: users },
    { label: t("admin.stat_restaurants"), value: restaurants },
    { label: t("admin.stat_orders"), value: orders },
    { label: t("admin.stat_active_ads"), value: ads },
    { label: t("admin.stat_active_festivals"), value: festivals },
    { label: t("admin.stat_total_commission"), value: formatToman(deliveredOrders._sum.commissionFee || 0, locale) },
    { label: t("admin.stat_total_courier_fee"), value: formatToman(deliveredOrders._sum.courierFee || 0, locale) },
    { label: t("admin.stat_total_revenue"), value: formatToman(deliveredOrders._sum.total || 0, locale) },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t("admin.dashboard")}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="mt-1 text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
