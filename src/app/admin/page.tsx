import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
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
    { label: "کاربران", value: users },
    { label: "رستوران‌ها", value: restaurants },
    { label: "سفارش‌ها", value: orders },
    { label: "تبلیغات فعال", value: ads },
    { label: "جشنواره‌های فعال", value: festivals },
    { label: "مجموع کمیسیون", value: formatToman(deliveredOrders._sum.commissionFee || 0) },
    { label: "مجموع حق سرویس پیک", value: formatToman(deliveredOrders._sum.courierFee || 0) },
    { label: "مجموع فروش", value: formatToman(deliveredOrders._sum.total || 0) },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">داشبورد ادمین</h1>
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
