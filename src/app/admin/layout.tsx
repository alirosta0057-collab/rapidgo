import Link from "next/link";
import { requireRole } from "@/lib/requireRole";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN"]);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="card h-fit p-3">
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/admin" className="rounded px-2 py-1.5 hover:bg-brand-50">داشبورد</Link>
          <Link href="/admin/categories" className="rounded px-2 py-1.5 hover:bg-brand-50">دسته‌بندی‌ها</Link>
          <Link href="/admin/restaurants" className="rounded px-2 py-1.5 hover:bg-brand-50">رستوران‌ها</Link>
          <Link href="/admin/products" className="rounded px-2 py-1.5 hover:bg-brand-50">محصولات سوپرمارکت</Link>
          <Link href="/admin/orders" className="rounded px-2 py-1.5 hover:bg-brand-50">سفارش‌ها</Link>
          <Link href="/admin/couriers" className="rounded px-2 py-1.5 hover:bg-brand-50">پیک‌ها</Link>
          <Link href="/admin/commissions" className="rounded px-2 py-1.5 hover:bg-brand-50">کمیسیون</Link>
          <Link href="/admin/ads" className="rounded px-2 py-1.5 hover:bg-brand-50">تبلیغات</Link>
          <Link href="/admin/festivals" className="rounded px-2 py-1.5 hover:bg-brand-50">جشنواره‌ها</Link>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
