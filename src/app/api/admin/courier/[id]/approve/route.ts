import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { approved } = await req.json();
  await prisma.courierProfile.update({ where: { id: params.id }, data: { isApproved: !!approved } });
  return NextResponse.json({ ok: true });
}
