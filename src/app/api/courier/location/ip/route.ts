import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "0.0.0.0";
}

function vercelGeo(headers: Headers): { lat: number; lng: number; city: string | null } | null {
  const lat = headers.get("x-vercel-ip-latitude");
  const lng = headers.get("x-vercel-ip-longitude");
  if (!lat || !lng) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;
  const cityRaw = headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw) : null;
  return { lat: numLat, lng: numLng, city };
}

async function lookupViaIpApi(ip: string): Promise<{ lat: number; lng: number; city: string | null } | null> {
  if (!ip || ip === "0.0.0.0" || ip.startsWith("127.") || ip.startsWith("::1")) return null;
  try {
    const r = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { "User-Agent": "rapidgo/1.0" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    const lat = Number(data?.latitude);
    const lng = Number(data?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, city: data?.city || null };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(req.headers);
  let geo = vercelGeo(req.headers);
  if (!geo) {
    geo = await lookupViaIpApi(ip);
  }
  if (!geo) {
    return NextResponse.json({ error: "geo_unavailable" }, { status: 503 });
  }

  const profile = await prisma.courierProfile.upsert({
    where: { userId: session.user.id },
    update: {
      lastLat: geo.lat,
      lastLng: geo.lng,
      lastIp: ip,
      lastSeenAt: new Date(),
      isOnline: true,
    },
    create: {
      userId: session.user.id,
      lastLat: geo.lat,
      lastLng: geo.lng,
      lastIp: ip,
      lastSeenAt: new Date(),
      isOnline: true,
    },
  });

  await prisma.courierLocation.create({
    data: {
      courierId: profile.id,
      lat: geo.lat,
      lng: geo.lng,
      ip,
    },
  });

  return NextResponse.json({
    ok: true,
    lat: geo.lat,
    lng: geo.lng,
    city: geo.city,
    source: "ip",
  });
}
