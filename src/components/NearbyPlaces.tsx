"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/i18n/client";

type PlaceKind = "food" | "groceries" | "hygiene" | "taxi" | "courier";

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

type Origin = { lat: number; lng: number; source: "gps" | "ip"; city?: string | null };

const RADII_KM = [1, 2, 5, 10, 20] as const;
const KINDS: PlaceKind[] = ["food", "groceries", "hygiene", "taxi", "courier"];

export function NearbyPlaces() {
  const { t, locale } = useLocale();
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [originError, setOriginError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<(typeof RADII_KM)[number]>(2);
  const [kind, setKind] = useState<PlaceKind>("food");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numberFmt = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");

  const tryGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps" }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/geo/me", { cache: "no-store" });
        if (!r.ok) {
          if (!cancelled) setOriginError("geo_unavailable");
          return;
        }
        const d = await r.json();
        if (cancelled) return;
        setOrigin({ lat: d.lat, lng: d.lng, source: "ip", city: d.city });
      } catch {
        if (!cancelled) setOriginError("geo_unavailable");
      }
    })();
    tryGps();
    return () => {
      cancelled = true;
    };
  }, [tryGps]);

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const radiusM = radiusKm * 1000;
    const url = `/api/places?lat=${origin.lat}&lng=${origin.lng}&radius=${radiusM}&kind=${kind}`;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setError(d.errorCode || "places_failed");
          setPlaces([]);
          return;
        }
        setPlaces(d.places || []);
      })
      .catch(() => {
        if (!cancelled) setError("network_error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, radiusKm, kind]);

  function formatDistance(m: number): string {
    if (m < 1000) return `${numberFmt.format(m)} ${t("places.unit_m")}`;
    return `${numberFmt.format(Math.round(m / 100) / 10)} ${t("places.unit_km")}`;
  }

  return (
    <section className="card space-y-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">{t("places.title")}</h2>
        <div className="text-xs text-gray-500">
          {origin
            ? origin.source === "gps"
              ? t("places.location_gps")
              : t("places.location_ip", { city: origin.city ?? "" })
            : originError
              ? t("places.location_unavailable")
              : t("places.detecting_location")}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-3 py-1 text-sm border ${
              kind === k ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t(`places.kind_${k}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">{t("places.radius")}:</span>
        {RADII_KM.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRadiusKm(r)}
            className={`rounded-full px-3 py-1 border ${
              radiusKm === r ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {numberFmt.format(r)} {t("places.unit_km")}
          </button>
        ))}
      </div>

      {!origin && !originError && <div className="text-sm text-gray-500">{t("places.detecting_location")}</div>}
      {originError && <div className="text-sm text-red-600">{t("places.location_unavailable")}</div>}
      {error && origin && <div className="text-sm text-red-600">{t(`places.error_${error}`)}</div>}

      {origin && !error && (
        <>
          {loading && <div className="text-sm text-gray-500">{t("common.loading")}</div>}
          {!loading && places.length === 0 && (
            <div className="text-sm text-gray-500">{t("places.no_results")}</div>
          )}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <li key={p.id} className="rounded-lg border border-gray-200 p-3 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{p.name}</div>
                  <span className="text-xs text-brand-700">{formatDistance(p.distanceM)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">{p.category}</div>
                {p.address && <div className="mt-1 text-xs text-gray-500 line-clamp-1">{p.address}</div>}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-700 hover:underline"
                  >
                    {t("places.view_on_map")}
                  </a>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="text-gray-600 hover:underline">
                      {p.phone}
                    </a>
                  )}
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noreferrer" className="text-gray-600 hover:underline">
                      {t("places.website")}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-xs text-gray-400">{t("places.osm_attribution")}</p>
    </section>
  );
}
