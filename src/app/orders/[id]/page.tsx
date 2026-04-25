import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ORDER_STATUS_FA, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import { OrderTracker } from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${params.id}`);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      restaurant: true,
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      address: true,
    },
  });
  if (!order) notFound();
  const isCustomer = order.customerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const isAssignedCourier = order.courierId === session.user.id;
  if (!isCustomer && !isAdmin && !isAssignedCourier) redirect("/");

  let courier: { user: { name: string; email: string }; lastLat: number | null; lastLng: number | null; lastIp: string | null; lastSeenAt: Date | null } | null = null;
  if (order.courierId) {
    courier = await prisma.courierProfile.findUnique({
      where: { userId: order.courierId },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">سفارش #{order.id.slice(-6)}</h1>
          <span className="badge bg-brand-100 text-brand-700">{ORDER_STATUS_FA[order.status as OrderStatus]}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString("fa-IR")}</div>
      </div>

      {courier && courier.lastLat != null && courier.lastLng != null && (
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">موقعیت پیک</h2>
          <div className="mb-2 text-sm text-gray-600">
            {courier.user.name} — IP: {courier.lastIp || "-"} — آخرین بروزرسانی: {courier.lastSeenAt ? new Date(courier.lastSeenAt).toLocaleString("fa-IR") : "-"}
          </div>
          <OrderTracker orderId={order.id} initialLat={courier.lastLat} initialLng={courier.lastLng} />
        </div>
      )}

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">آیتم‌ها</h2>
        <div className="divide-y">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-2 text-sm">
              <span>{it.name} × {it.quantity}</span>
              <span>{formatToman(it.unitPrice * it.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>جمع آیتم‌ها</span><span>{formatToman(order.itemsTotal)}</span></div>
          <div className="flex justify-between text-gray-500"><span>کمیسیون سایت</span><span>{formatToman(order.commissionFee)}</span></div>
          <div className="flex justify-between"><span>حق سرویس پیک</span><span>{formatToman(order.courierFee)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>تخفیف ({order.discountCode})</span><span>- {formatToman(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold"><span>قابل پرداخت</span><span>{formatToman(order.total)}</span></div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">تاریخچه وضعیت</h2>
        <ul className="space-y-1 text-sm">
          {order.events.map((ev) => (
            <li key={ev.id} className="flex justify-between">
              <span>{ORDER_STATUS_FA[ev.status as OrderStatus] || ev.status}</span>
              <span className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString("fa-IR")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
