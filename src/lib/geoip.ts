export type GeoIpResult = { lat: number; lng: number; city: string | null; country: string | null };

export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "0.0.0.0";
}

export function vercelGeo(headers: Headers): GeoIpResult | null {
  const lat = headers.get("x-vercel-ip-latitude");
  const lng = headers.get("x-vercel-ip-longitude");
  if (!lat || !lng) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) return null;
  const cityRaw = headers.get("x-vercel-ip-city");
  const city = cityRaw ? decodeURIComponent(cityRaw) : null;
  const country = headers.get("x-vercel-ip-country");
  return { lat: numLat, lng: numLng, city, country };
}

export async function lookupViaIpApi(ip: string): Promise<GeoIpResult | null> {
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
    return { lat, lng, city: data?.city || null, country: data?.country || null };
  } catch {
    return null;
  }
}

export async function resolveGeo(headers: Headers): Promise<GeoIpResult | null> {
  const v = vercelGeo(headers);
  if (v) return v;
  return lookupViaIpApi(clientIp(headers));
}
