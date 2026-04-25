import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  festivalId: z.string().optional().nullable(),
  code: z.string().min(2),
  description: z.string().optional(),
  percentOff: z.number().int().min(0).max(100).optional().nullable(),
  amountOff: z.number().int().min(0).optional().nullable(),
  minOrderTotal: z.number().int().min(0).default(0),
  maxRedemptions: z.number().int().min(0).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const data = parsed.data;
  const promo = await prisma.promotion.create({
    data: {
      code: data.code,
      festivalId: data.festivalId || null,
      description: data.description || null,
      percentOff: data.percentOff ?? null,
      amountOff: data.amountOff ?? null,
      minOrderTotal: data.minOrderTotal,
      maxRedemptions: data.maxRedemptions ?? null,
    },
  });
  return NextResponse.json(promo);
}
