import { requireRole } from "@/lib/requireRole";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MenuEditor } from "@/components/restaurant/MenuEditor";
import { OrdersForRestaurant } from "@/components/restaurant/OrdersForRestaurant";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function RestaurantManagePage({ params }: { params: { id: string } }) {
  const { t } = getT();
  const session = await requireRole(["RESTAURANT", "ADMIN"]);
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.id },
    include: { menu: { orderBy: { createdAt: "desc" } } },
  });
  if (!restaurant) notFound();
  if (restaurant.ownerId !== session.user.id && session.user.role !== "ADMIN") redirect("/restaurant");

  const orders = await prisma.order.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <div className="mt-1 text-sm text-gray-500">{restaurant.address}</div>
        <div className="mt-2 text-xs">
          {restaurant.isApproved ? (
            <span className="badge bg-green-100 text-green-700">{t("restaurant_panel.approved")}</span>
          ) : (
            <span className="badge bg-yellow-100 text-yellow-700">{t("restaurant_panel.pending_admin_approval")}</span>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("restaurant_panel.food_menu")}</h2>
        <MenuEditor restaurantId={restaurant.id} initial={restaurant.menu} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("restaurant_panel.recent_orders")}</h2>
        <OrdersForRestaurant orders={orders} />
      </section>
    </div>
  );
}
