"use client";

import { ORDER_STATUS_FA, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  customer: { name: string };
  items: { name: string; quantity: number }[];
};

export function OrdersForRestaurant({ orders }: { orders: Order[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-brand-50 text-right">
          <tr>
            <th className="p-3">شناسه</th>
            <th className="p-3">مشتری</th>
            <th className="p-3">آیتم‌ها</th>
            <th className="p-3">جمع</th>
            <th className="p-3">وضعیت</th>
            <th className="p-3">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-3 font-mono text-xs">#{o.id.slice(-6)}</td>
              <td className="p-3 text-xs">{o.customer.name}</td>
              <td className="p-3 text-xs">{o.items.map((i) => `${i.name} ×${i.quantity}`).join(" / ")}</td>
              <td className="p-3">{formatToman(o.total)}</td>
              <td className="p-3"><span className="badge bg-brand-50 text-brand-700">{ORDER_STATUS_FA[o.status as OrderStatus]}</span></td>
              <td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("fa-IR")}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td className="p-4 text-gray-500" colSpan={6}>سفارشی نیست.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
