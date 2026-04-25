import { requireRole } from "@/lib/requireRole";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RestaurantOwnerPage() {
  const session = await requireRole(["RESTAURANT", "ADMIN"]);
  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">رستوران‌های من</h1>
        <Link href="/restaurant/setup" className="btn-primary">ثبت رستوران جدید</Link>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {restaurants.map((r) => (
          <Link key={r.id} href={`/restaurant/${r.id}`} className="card p-4 hover:shadow-md">
            <div className="font-semibold">{r.name}</div>
            <div className="text-xs text-gray-500">{r.address}</div>
            <div className="mt-2 text-xs">
              {r.isApproved ? (
                <span className="badge bg-green-100 text-green-700">تایید شده</span>
              ) : (
                <span className="badge bg-yellow-100 text-yellow-700">در انتظار تایید</span>
              )}
            </div>
          </Link>
        ))}
        {restaurants.length === 0 && (
          <div className="text-gray-500">هنوز رستورانی ثبت نکرده‌اید.</div>
        )}
      </div>
    </div>
  );
}
