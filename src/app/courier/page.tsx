import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourierDashboard } from "@/components/CourierDashboard";

export const dynamic = "force-dynamic";

export default async function CourierPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/courier");
  if (session.user.role !== "COURIER" && session.user.role !== "ADMIN") redirect("/");

  const [available, mine, profile] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", courierId: null },
      orderBy: { createdAt: "desc" },
      include: { restaurant: true, address: true, items: true },
      take: 20,
    }),
    prisma.order.findMany({
      where: { courierId: session.user.id, status: { in: ["ACCEPTED", "PREPARING", "ON_THE_WAY"] } },
      orderBy: { createdAt: "desc" },
      include: { restaurant: true, address: true, items: true },
    }),
    prisma.courierProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  return <CourierDashboard available={available} mine={mine} profile={profile} />;
}
