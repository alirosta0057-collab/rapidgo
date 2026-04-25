import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureOwner(restaurantId: string, userId: string, role: string) {
  if (role === "ADMIN") return true;
  const r = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  return r?.ownerId === userId;
}

export async function PATCH(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await ensureOwner(params.id, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const item = await prisma.menuItem.update({ where: { id: params.itemId }, data: body });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await ensureOwner(params.id, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.menuItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true });
}
