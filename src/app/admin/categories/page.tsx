import { prisma } from "@/lib/prisma";
import { CategoriesEditor } from "@/components/admin/CategoriesEditor";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>
      <CategoriesEditor initial={categories} />
    </div>
  );
}
