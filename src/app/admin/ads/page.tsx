import { prisma } from "@/lib/prisma";
import { AdsEditor } from "@/components/admin/AdsEditor";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">تبلیغات</h1>
      <AdsEditor ads={ads} />
    </div>
  );
}
