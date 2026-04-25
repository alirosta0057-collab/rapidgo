import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const total = Number(searchParams.get("total") || "0");
  if (!code) return NextResponse.json({ error: "code_required" }, { status: 400 });
  const promo = await prisma.promotion.findUnique({ where: { code } });
  if (!promo || !promo.isActive) return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  if (promo.startsAt && promo.startsAt > new Date()) return NextResponse.json({ error: "not_started" }, { status: 400 });
  if (promo.endsAt && promo.endsAt < new Date()) return NextResponse.json({ error: "expired" }, { status: 400 });
  if (total < promo.minOrderTotal) return NextResponse.json({ error: "min_total_not_met" }, { status: 400 });
  if (promo.maxRedemptions && promo.redemptions >= promo.maxRedemptions) return NextResponse.json({ error: "exhausted" }, { status: 400 });

  let discountAmount = 0;
  if (promo.percentOff) discountAmount = Math.round(total * (promo.percentOff / 100));
  else if (promo.amountOff) discountAmount = promo.amountOff;

  return NextResponse.json({ discountAmount, code: promo.code });
}
