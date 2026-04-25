import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function FestivalsPage() {
  const { t, locale } = getT();
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";
  const festivals = await prisma.festival.findMany({
    where: { isActive: true },
    orderBy: { startsAt: "desc" },
    include: { promotions: { where: { isActive: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("festivals.title")}</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {festivals.map((f) => (
          <Link key={f.id} href={`/festivals/${f.slug}`} className="card p-4 hover:shadow-md">
            <div className="text-lg font-semibold">{f.title}</div>
            <p className="mt-1 text-sm text-gray-600">{f.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              {t("festivals.range", {
                start: new Date(f.startsAt).toLocaleDateString(dateLocale),
                end: new Date(f.endsAt).toLocaleDateString(dateLocale),
              })}
            </div>
            <div className="mt-2 text-xs text-brand-700">
              {t("festivals.promo_count", { n: f.promotions.length })}
            </div>
          </Link>
        ))}
        {festivals.length === 0 && <div className="text-gray-500">{t("festivals.none")}</div>}
      </div>
    </div>
  );
}
