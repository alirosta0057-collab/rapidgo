import { NextResponse } from "next/server";
import { resolveGeo } from "@/lib/geoip";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const geo = await resolveGeo(req.headers);
  if (!geo) {
    return NextResponse.json({ errorCode: "geo_unavailable" }, { status: 503 });
  }
  return NextResponse.json({
    lat: geo.lat,
    lng: geo.lng,
    city: geo.city,
    country: geo.country,
    source: "ip",
  });
}
