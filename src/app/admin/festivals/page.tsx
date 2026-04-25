import { prisma } from "@/lib/prisma";
import { FestivalsEditor } from "@/components/admin/FestivalsEditor";

export const dynamic = "force-dynamic";

export default async function AdminFestivalsPage() {
  const festivals = await prisma.festival.findMany({
    orderBy: { startsAt: "desc" },
    include: { promotions: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">جشنواره‌ها و کدهای تخفیف</h1>
      <FestivalsEditor festivals={festivals} />
    </div>
  );
}
