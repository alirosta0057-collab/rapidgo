import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ORDER_STATUS_KEY, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/orders");
  const { t, locale } = getT();

  const orders = await prisma.order.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { restaurant: true, items: true },
  });

  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("orders.my_title")}</h1>
      {orders.length === 0 && <div className="card p-8 text-center text-gray-500">{t("orders.none")}</div>}
      <div className="space-y-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center justify-between p-4 hover:shadow-md">
            <div>
              <div className="font-medium">
                {o.restaurant?.name || t("orders.supermarket")} — {t("orders.items_count", { n: o.items.length })}
              </div>
              <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString(dateLocale)}</div>
            </div>
            <div className="text-left">
              <div className="font-bold">{formatToman(o.total, locale)}</div>
              <div className="text-xs">
                <span className="badge bg-brand-50 text-brand-700">{t(ORDER_STATUS_KEY[o.status as OrderStatus])}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
