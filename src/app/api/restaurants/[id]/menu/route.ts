import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().min(0),
  imageUrl: z.string().optional(),
});

async function ensureOwner(restaurantId: string, userId: string, role: string) {
  if (role === "ADMIN") return true;
  const r = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  return r?.ownerId === userId;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await ensureOwner(params.id, session.user.id, session.user.role))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const item = await prisma.menuItem.create({
    data: {
      restaurantId: params.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price: parsed.data.price,
      imageUrl: parsed.data.imageUrl || null,
    },
  });
  return NextResponse.json(item);
}
