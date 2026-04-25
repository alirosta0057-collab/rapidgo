import { prisma } from "@/lib/prisma";
import { CategoriesEditor } from "@/components/admin/CategoriesEditor";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { t } = getT();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.categories_title")}</h1>
      <CategoriesEditor initial={categories} />
    </div>
  );
}
