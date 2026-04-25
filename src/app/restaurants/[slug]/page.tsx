import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: params.slug },
    include: {
      menu: { where: { isAvailable: true }, orderBy: { createdAt: "desc" } },
      categories: { include: { category: true } },
    },
  });
  if (!restaurant || !restaurant.isApproved) notFound();

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        {restaurant.coverUrl ? (
          <Image src={restaurant.coverUrl} alt={restaurant.name} width={1200} height={300} className="h-48 w-full object-cover" />
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-brand-100 to-brand-50" />
        )}
        <div className="p-4">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{restaurant.address}</p>
          <p className="mt-2 text-sm">{restaurant.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {restaurant.categories.map((rc) => (
              <span key={rc.categoryId} className="badge bg-brand-50 text-brand-700">{rc.category.name}</span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold">منو</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {restaurant.menu.map((item) => (
            <div key={item.id} className="card flex gap-4 overflow-hidden p-3">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} width={120} height={120} className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="h-24 w-24 shrink-0 rounded-lg bg-gray-100" />
              )}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{item.description}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-700">{formatToman(item.price)}</span>
                  <AddToCartButton
                    item={{
                      id: item.id,
                      kind: "menu",
                      restaurantId: restaurant.id,
                      name: item.name,
                      unitPrice: item.price,
                      quantity: 1,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {restaurant.menu.length === 0 && <div className="col-span-full text-gray-500">منویی ثبت نشده.</div>}
        </div>
      </div>
    </div>
  );
}
