import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function FestivalPage({ params }: { params: { slug: string } }) {
  const festival = await prisma.festival.findUnique({
    where: { slug: params.slug },
    include: { promotions: { where: { isActive: true } } },
  });
  if (!festival) notFound();

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{festival.title}</h1>
        <p className="mt-2 text-gray-600">{festival.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          {new Date(festival.startsAt).toLocaleDateString("fa-IR")} تا {new Date(festival.endsAt).toLocaleDateString("fa-IR")}
        </div>
      </div>

      <h2 className="text-lg font-bold">کدهای تخفیف</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {festival.promotions.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-brand-700">{p.code}</span>
              <span className="badge bg-brand-100 text-brand-700">
                {p.percentOff ? `${p.percentOff}٪` : p.amountOff ? formatToman(p.amountOff) : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{p.description}</p>
            {p.minOrderTotal > 0 && (
              <p className="mt-1 text-xs text-gray-500">حداقل سفارش: {formatToman(p.minOrderTotal)}</p>
            )}
          </div>
        ))}
        {festival.promotions.length === 0 && <div className="text-gray-500">کدی فعال نیست.</div>}
      </div>
    </div>
  );
}
