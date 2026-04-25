import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  lat: z.number(),
  lng: z.number(),
});

function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "0.0.0.0";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const ip = clientIp(req.headers);
  const profile = await prisma.courierProfile.upsert({
    where: { userId: session.user.id },
    update: {
      lastLat: parsed.data.lat,
      lastLng: parsed.data.lng,
      lastIp: ip,
      lastSeenAt: new Date(),
      isOnline: true,
    },
    create: {
      userId: session.user.id,
      lastLat: parsed.data.lat,
      lastLng: parsed.data.lng,
      lastIp: ip,
      lastSeenAt: new Date(),
      isOnline: true,
    },
  });

  await prisma.courierLocation.create({
    data: {
      courierId: profile.id,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      ip,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courierUserId = searchParams.get("courierUserId");
  const orderId = searchParams.get("orderId");

  let courierId: string | undefined;
  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.courierId) return NextResponse.json({ error: "no_courier" }, { status: 404 });
    const profile = await prisma.courierProfile.findUnique({ where: { userId: order.courierId } });
    courierId = profile?.id;
  } else if (courierUserId) {
    const profile = await prisma.courierProfile.findUnique({ where: { userId: courierUserId } });
    courierId = profile?.id;
  }

  if (!courierId) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const profile = await prisma.courierProfile.findUnique({
    where: { id: courierId },
    select: { lastLat: true, lastLng: true, lastIp: true, lastSeenAt: true, isOnline: true },
  });
  return NextResponse.json(profile);
}
