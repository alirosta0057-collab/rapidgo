import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatToman } from "@/lib/money";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function FestivalPage({ params }: { params: { slug: string } }) {
  const { t, locale } = getT();
  const dateLocale = locale === "fa" ? "fa-IR" : "en-US";
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
          {t("festivals.range", {
            start: new Date(festival.startsAt).toLocaleDateString(dateLocale),
            end: new Date(festival.endsAt).toLocaleDateString(dateLocale),
          })}
        </div>
      </div>

      <h2 className="text-lg font-bold">{t("festivals.promo_codes")}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {festival.promotions.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-brand-700">{p.code}</span>
              <span className="badge bg-brand-100 text-brand-700">
                {p.percentOff
                  ? t("festivals.percent_off_label", { percent: p.percentOff })
                  : p.amountOff
                  ? t("festivals.amount_off_label", { amount: formatToman(p.amountOff, locale) })
                  : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{p.description}</p>
            {p.minOrderTotal > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {t("festivals.min_order", { amount: formatToman(p.minOrderTotal, locale) })}
              </p>
            )}
          </div>
        ))}
        {festival.promotions.length === 0 && (
          <div className="text-gray-500">{t("festivals.no_active_codes")}</div>
        )}
      </div>
    </div>
  );
}
