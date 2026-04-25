import { prisma } from "@/lib/prisma";
import { FestivalsEditor } from "@/components/admin/FestivalsEditor";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminFestivalsPage() {
  const { t } = getT();
  const festivals = await prisma.festival.findMany({
    orderBy: { startsAt: "desc" },
    include: { promotions: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.festivals_title")}</h1>
      <FestivalsEditor festivals={festivals} />
    </div>
  );
}
