import Link from "next/link";
import { requireRole } from "@/lib/requireRole";
import { getT } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN"]);
  const { t } = getT();
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="card h-fit p-3">
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/admin" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_dashboard")}</Link>
          <Link href="/admin/categories" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_categories")}</Link>
          <Link href="/admin/restaurants" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_restaurants")}</Link>
          <Link href="/admin/products" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_products")}</Link>
          <Link href="/admin/orders" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_orders")}</Link>
          <Link href="/admin/couriers" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_couriers")}</Link>
          <Link href="/admin/commissions" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_commissions")}</Link>
          <Link href="/admin/ads" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_ads")}</Link>
          <Link href="/admin/festivals" className="rounded px-2 py-1.5 hover:bg-brand-50">{t("admin.nav_festivals")}</Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
