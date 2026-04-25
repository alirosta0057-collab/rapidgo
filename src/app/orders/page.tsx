import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ORDER_STATUS_FA, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/orders");

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { restaurant: true, items: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">سفارش‌های من</h1>
      {orders.length === 0 && <div className="card p-8 text-center text-gray-500">سفارشی ثبت نشده.</div>}
      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center justify-between p-4 hover:shadow-md">
            <div>
              <div className="font-medium">
                {o.restaurant?.name || "خرید سوپرمارکت"} — {o.items.length} آیتم
              </div>
              <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("fa-IR")}</div>
            </div>
            <div className="text-left">
              <div className="font-bold">{formatToman(o.total)}</div>
              <div className="text-xs">
                <span className="badge bg-brand-50 text-brand-700">{ORDER_STATUS_FA[o.status as OrderStatus]}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
