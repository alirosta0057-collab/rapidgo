import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url().or(z.string().min(1)),
  linkUrl: z.string().optional(),
  placement: z.enum(["HOME", "CATEGORY", "RESTAURANT"]).default("HOME"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ad = await prisma.ad.create({
    data: { ...parsed.data, linkUrl: parsed.data.linkUrl || null },
  });
  return NextResponse.json(ad);
}
