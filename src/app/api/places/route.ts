import { NextResponse } from "next/server";
import { PLACE_KINDS, ALLOWED_RADII_M, type PlaceKind } from "@/lib/places";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type OverpassNode = {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  category: string;
  lat: number;
  lng: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  distanceM: number;
};

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

function buildQuery(kind: PlaceKind, lat: number, lng: number, radiusM: number): string {
  const around = `(around:${radiusM},${lat},${lng})`;
  const filters = PLACE_KINDS[kind].map((f) => `${f}${around};`).join("\n  ");
  return `[out:json][timeout:25];\n(\n  ${filters}\n);\nout body 80;`;
}

async function runOverpass(query: string, signal: AbortSignal): Promise<OverpassNode[]> {
  let lastErr: unknown = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal,
      });
      if (!res.ok) {
        lastErr = new Error(`overpass_status_${res.status}`);
        continue;
      }
      const data = (await res.json()) as { elements?: OverpassNode[] };
      return (data.elements || []).filter((e) => e.type === "node");
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("overpass_failed");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const latRaw = url.searchParams.get("lat");
  const lngRaw = url.searchParams.get("lng");
  if (latRaw === null || lngRaw === null) {
    return NextResponse.json({ errorCode: "invalid_coords" }, { status: 400 });
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  const radiusM = Number(url.searchParams.get("radius") || 2000);
  const kind = (url.searchParams.get("kind") || "food") as PlaceKind;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ errorCode: "invalid_coords" }, { status: 400 });
  }
  if (!ALLOWED_RADII_M.has(radiusM)) {
    return NextResponse.json({ errorCode: "invalid_radius" }, { status: 400 });
  }
  if (!(kind in PLACE_KINDS)) {
    return NextResponse.json({ errorCode: "invalid_kind" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let nodes: OverpassNode[];
  try {
    nodes = await runOverpass(buildQuery(kind, lat, lng, radiusM), controller.signal);
  } catch {
    return NextResponse.json({ errorCode: "overpass_unavailable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const places: Place[] = nodes
    .map((n) => {
      const tags = n.tags || {};
      const name = tags.name || tags["name:en"] || tags["name:fa"] || tags.brand || "";
      if (!name) return null;
      const category = tags.amenity || tags.shop || kind;
      const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
      const address = addressParts.length ? addressParts.join(" ") : null;
      const place: Place = {
        id: `osm-${n.id}`,
        name,
        kind,
        category,
        lat: n.lat,
        lng: n.lon,
        address,
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        distanceM: distanceMeters(lat, lng, n.lat, n.lon),
      };
      return place;
    })
    .filter((p): p is Place => p !== null)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 60);

  return NextResponse.json({
    origin: { lat, lng },
    radiusM,
    kind,
    count: places.length,
    places,
  });
}
