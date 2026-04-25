import { prisma } from "@/lib/prisma";
import { ProductsEditor } from "@/components/admin/ProductsEditor";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { t } = getT();
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } }),
    prisma.category.findMany({ where: { kind: { in: ["HYGIENE", "SUPERSTORE"] } }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.products_title")}</h1>
      <ProductsEditor products={products} categories={categories} />
    </div>
  );
}
