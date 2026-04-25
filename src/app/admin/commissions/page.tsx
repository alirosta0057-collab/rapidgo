import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminCommissions() {
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
      <h1 className="text-2xl font-bold">کمیسیون و حق سرویس</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-gray-500">جمع فروش (آیتم‌ها)</div>
          <div className="mt-1 text-xl font-bold">{formatToman(totals.gross)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">جمع کمیسیون سایت</div>
          <div className="mt-1 text-xl font-bold text-brand-700">{formatToman(totals.commission)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">جمع حق سرویس پیک</div>
          <div className="mt-1 text-xl font-bold">{formatToman(totals.courierFee)}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">سفارش</th>
              <th className="p-3">رستوران</th>
              <th className="p-3">آیتم‌ها</th>
              <th className="p-3">نرخ</th>
              <th className="p-3">کمیسیون</th>
              <th className="p-3">حق پیک</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono text-xs">#{o.id.slice(-6)}</td>
                <td className="p-3 text-xs">{o.restaurant?.name || "سوپرمارکت"}</td>
                <td className="p-3">{formatToman(o.itemsTotal)}</td>
                <td className="p-3 text-gray-500">{(o.commissionRate * 100).toFixed(0)}٪</td>
                <td className="p-3 text-brand-700">{formatToman(o.commissionFee)}</td>
                <td className="p-3">{formatToman(o.courierFee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
