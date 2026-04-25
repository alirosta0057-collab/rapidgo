import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FestivalsPage() {
  const festivals = await prisma.festival.findMany({
    where: { isActive: true },
    orderBy: { startsAt: "desc" },
    include: { promotions: { where: { isActive: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">جشنواره‌ها</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {festivals.map((f) => (
          <Link key={f.id} href={`/festivals/${f.slug}`} className="card p-4 hover:shadow-md">
            <div className="text-lg font-semibold">{f.title}</div>
            <p className="mt-1 text-sm text-gray-600">{f.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              {new Date(f.startsAt).toLocaleDateString("fa-IR")} تا {new Date(f.endsAt).toLocaleDateString("fa-IR")}
            </div>
            <div className="mt-2 text-xs text-brand-700">{f.promotions.length} کد تخفیف</div>
          </Link>
        ))}
        {festivals.length === 0 && <div className="text-gray-500">جشنواره فعالی نیست.</div>}
      </div>
    </div>
  );
}
