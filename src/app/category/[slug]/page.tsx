import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";
import { AddToCartButton } from "@/components/AddToCartButton";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { t, locale } = getT();
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: { orderBy: { createdAt: "desc" } },
      restaurants: { include: { restaurant: true } },
      children: true,
    },
  });
  if (!category) notFound();

  const kindLabel =
    category.kind === "FOOD"
      ? t("category.food")
      : category.kind === "HYGIENE"
      ? t("category.hygiene")
      : t("category.superstore");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="text-sm text-gray-500">{kindLabel}</p>
      </div>

      {category.children.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">{t("category.subcategories")}</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="badge bg-brand-50 text-brand-700 hover:bg-brand-100">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {category.kind !== "FOOD" && (
        <section>
          <h2 className="mb-3 font-semibold">{t("category.products")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {category.products.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} width={300} height={200} className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 w-full bg-gray-100" />
                )}
                <div className="space-y-2 p-3">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{p.description}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-700">{formatToman(p.price, locale)}</span>
                    <AddToCartButton
                      item={{ id: p.id, kind: "product", name: p.name, unitPrice: p.price, quantity: 1 }}
                      disabled={p.stock <= 0}
                    />
                  </div>
                </div>
              </div>
            ))}
            {category.products.length === 0 && (
              <div className="col-span-full text-gray-500">{t("category.no_products")}</div>
            )}
          </div>
        </section>
      )}

      {category.kind === "FOOD" && (
        <section>
          <h2 className="mb-3 font-semibold">{t("category.restaurants")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {category.restaurants.map(({ restaurant: r }) => (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="card overflow-hidden hover:shadow-md">
                {r.coverUrl ? (
                  <Image src={r.coverUrl} alt={r.name} width={400} height={200} className="h-32 w-full object-cover" />
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-brand-100 to-brand-50" />
                )}
                <div className="p-3">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{r.address}</div>
                </div>
              </Link>
            ))}
            {category.restaurants.length === 0 && (
              <div className="col-span-full text-gray-500">{t("category.no_restaurants_in_category")}</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
