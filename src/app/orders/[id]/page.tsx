import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ORDER_STATUS_KEY, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import { OrderTracker } from "@/components/OrderTracker";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${params.id}`);
  const { t, locale } = getT();
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

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
          <h1 className="text-xl font-bold">{t("orders.order_number", { id: order.id.slice(-6) })}</h1>
          <span className="badge bg-brand-100 text-brand-700">{t(ORDER_STATUS_KEY[order.status as OrderStatus])}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString(dateLocale)}</div>
      </div>

      {courier && courier.lastLat != null && courier.lastLng != null && (
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">{t("orders.courier_position")}</h2>
          <div className="mb-2 text-sm text-gray-600">
            {t("orders.courier_last_seen", {
              name: courier.user.name,
              ip: courier.lastIp || "-",
              time: courier.lastSeenAt ? new Date(courier.lastSeenAt).toLocaleString(dateLocale) : "-",
            })}
          </div>
          <OrderTracker orderId={order.id} initialLat={courier.lastLat} initialLng={courier.lastLng} />
        </div>
      )}

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">{t("orders.items")}</h2>
        <div className="divide-y">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-2 text-sm">
              <span>{t("orders.item_line", { name: it.name, qty: it.quantity })}</span>
              <span>{formatToman(it.unitPrice * it.quantity, locale)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>{t("orders.items_total")}</span><span>{formatToman(order.itemsTotal, locale)}</span></div>
          <div className="flex justify-between text-gray-500"><span>{t("orders.site_commission")}</span><span>{formatToman(order.commissionFee, locale)}</span></div>
          <div className="flex justify-between"><span>{t("orders.courier_fee")}</span><span>{formatToman(order.courierFee, locale)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t("orders.discount_with_code", { code: order.discountCode || "" })}</span><span>- {formatToman(order.discountAmount, locale)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold"><span>{t("orders.payable")}</span><span>{formatToman(order.total, locale)}</span></div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">{t("orders.status_history")}</h2>
        <ul className="space-y-1 text-sm">
          {order.events.map((ev) => (
            <li key={ev.id} className="flex justify-between">
              <span>{t(ORDER_STATUS_KEY[ev.status as OrderStatus] ?? "") || ev.status}</span>
              <span className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString(dateLocale)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
