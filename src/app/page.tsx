import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, restaurants, ads, festivals] = await Promise.all([
    prisma.category.findMany({ where: { parentId: null }, orderBy: { name: "asc" } }),
    prisma.restaurant.findMany({
      where: { isApproved: true },
      orderBy: { rating: "desc" },
      take: 8,
      include: { categories: { include: { category: true } } },
    }),
    prisma.ad.findMany({ where: { isActive: true, placement: "HOME" }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.festival.findMany({
      where: { isActive: true, endsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-10">
      {ads.length > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ads.map((ad) => (
            <a
              key={ad.id}
              href={ad.linkUrl || "#"}
              className="card overflow-hidden"
              target={ad.linkUrl ? "_blank" : undefined}
              rel="noreferrer"
            >
              {ad.imageUrl && (
                <Image src={ad.imageUrl} alt={ad.title} width={600} height={300} className="h-40 w-full object-cover" />
              )}
              <div className="p-3 font-medium">{ad.title}</div>
            </a>
          ))}
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">دسته‌بندی‌ها</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="card flex flex-col items-center justify-center p-4 text-center transition hover:shadow-md"
            >
              {c.imageUrl ? (
                <Image src={c.imageUrl} alt={c.name} width={64} height={64} className="mb-2 h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-2xl">🛒</div>
              )}
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">
                {c.kind === "FOOD" ? "غذایی" : c.kind === "HYGIENE" ? "بهداشتی" : "سوپرمارکت"}
              </div>
            </Link>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full text-gray-500">دسته‌بندی‌ای ثبت نشده.</div>
          )}
        </div>
      </section>

      {festivals.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">جشنواره‌های فعال</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {festivals.map((f) => (
              <Link key={f.id} href={`/festivals/${f.slug}`} className="card overflow-hidden p-4 hover:shadow-md">
                <div className="text-lg font-semibold">{f.title}</div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{f.description}</p>
                <div className="mt-2 text-xs text-brand-700">مشاهده کدهای تخفیف →</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">رستوران‌های پربازدید</h2>
          <Link href="/restaurants" className="text-sm text-brand-700 hover:underline">همه</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {restaurants.map((r) => (
            <Link key={r.id} href={`/restaurants/${r.slug}`} className="card overflow-hidden hover:shadow-md">
              {r.coverUrl ? (
                <Image src={r.coverUrl} alt={r.name} width={400} height={200} className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-brand-100 to-brand-50" />
              )}
              <div className="p-3">
                <div className="font-semibold">{r.name}</div>
                <div className="mt-1 text-xs text-gray-500 line-clamp-1">{r.address}</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="badge bg-brand-100 text-brand-700">⭐ {r.rating.toFixed(1)}</span>
                  <span className={r.isOpen ? "text-green-600" : "text-red-500"}>
                    {r.isOpen ? "باز" : "بسته"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {restaurants.length === 0 && <div className="col-span-full text-gray-500">رستورانی ثبت نشده.</div>}
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 ring-1 ring-black/5">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h3 className="text-lg font-bold">صاحب رستوران یا فروشگاه هستید؟</h3>
            <p className="text-sm text-gray-600">رستوران خود را ثبت کنید و سفارش آنلاین بپذیرید.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/register?role=RESTAURANT" className="btn-primary">ثبت رستوران</Link>
            <Link href="/register?role=COURIER" className="btn-outline">پیوستن به‌عنوان پیک</Link>
          </div>
        </div>
      </section>

      {/* placeholder helps server-rendered images example */}
      <span className="hidden">{formatToman(0)}</span>
    </div>
  );
}
