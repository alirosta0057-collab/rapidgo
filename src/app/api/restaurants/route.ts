import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  address: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== "RESTAURANT" && role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const restaurant = await prisma.restaurant.create({
    data: {
      ...parsed.data,
      description: parsed.data.description || null,
      phone: parsed.data.phone || null,
      ownerId: session.user.id,
      isApproved: role === "ADMIN",
    },
  });

  return NextResponse.json(restaurant);
}
