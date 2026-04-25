import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_FA, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, restaurant: true },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">سفارش‌ها</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">شناسه</th>
              <th className="p-3">مشتری</th>
              <th className="p-3">رستوران</th>
              <th className="p-3">جمع</th>
              <th className="p-3">کمیسیون</th>
              <th className="p-3">حق پیک</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">تاریخ</th>
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
                <td className="p-3 text-xs">{o.restaurant?.name || "سوپرمارکت"}</td>
                <td className="p-3">{formatToman(o.total)}</td>
                <td className="p-3 text-gray-500">{formatToman(o.commissionFee)}</td>
                <td className="p-3 text-gray-500">{formatToman(o.courierFee)}</td>
                <td className="p-3">
                  <span className="badge bg-brand-50 text-brand-700">{ORDER_STATUS_FA[o.status as OrderStatus]}</span>
                </td>
                <td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("fa-IR")}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={8}>سفارشی نیست.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
