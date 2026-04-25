import { prisma } from "@/lib/prisma";
import { AdsEditor } from "@/components/admin/AdsEditor";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const { t } = getT();
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.ads_title")}</h1>
      <AdsEditor ads={ads} />
    </div>
  );
}
