import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    where: { isApproved: true },
    orderBy: { rating: "desc" },
  });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">رستوران‌ها</h1>
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
              <div className="text-xs text-gray-500 line-clamp-1">{r.address}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="badge bg-brand-100 text-brand-700">⭐ {r.rating.toFixed(1)}</span>
                <span className={r.isOpen ? "text-green-600" : "text-red-500"}>{r.isOpen ? "باز" : "بسته"}</span>
              </div>
            </div>
          </Link>
        ))}
        {restaurants.length === 0 && <div className="col-span-full text-gray-500">رستورانی ثبت نشده.</div>}
      </div>
    </div>
  );
}
