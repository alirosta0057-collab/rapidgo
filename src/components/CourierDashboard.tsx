"use client";

import { useEffect, useRef, useState } from "react";
import { Map } from "./MapDynamic";
import { ORDER_STATUS_KEY, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";
import { useLocale } from "@/i18n/client";

type OrderLite = {
  id: string;
  status: string;
  total: number;
  courierFee: number;
  itemsTotal: number;
  notes: string | null;
  restaurant: { name: string; address: string; lat: number | null; lng: number | null } | null;
  address: { fullText: string; lat: number | null; lng: number | null } | null;
  items: { name: string; quantity: number }[];
};

type LocationSource = "gps" | "ip" | null;

const TEHRAN_CENTER = { lat: 35.6892, lng: 51.389 };

export function CourierDashboard({
  available,
  mine,
  profile,
}: {
  available: OrderLite[];
  mine: OrderLite[];
  profile: { lastLat: number | null; lastLng: number | null; lastIp: string | null; isOnline: boolean } | null;
}) {
  const { t, locale } = useLocale();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    profile?.lastLat != null && profile?.lastLng != null
      ? { lat: profile.lastLat, lng: profile.lastLng }
      : null
  );
  const [source, setSource] = useState<LocationSource>(null);
  const [tracking, setTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [tick, setTick] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const ipFallbackTried = useRef(false);
  const sourceRef = useRef<LocationSource>(null);
  const trackingRef = useRef(false);

  function handlePosition(p: GeolocationPosition) {
    const lat = p.coords.latitude;
    const lng = p.coords.longitude;
    setPos({ lat, lng });
    setSource("gps");
    sourceRef.current = "gps";
    setAccuracy(p.coords.accuracy ?? null);
    setLastUpdatedAt(Date.now());
    setUpdateCount((n) => n + 1);
    fetch("/api/courier/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    }).catch(() => {});
  }

  function gpsAlreadyEngaged(): boolean {
    return trackingRef.current || sourceRef.current === "gps";
  }

  async function fallbackToIp(reason: "denied" | "unavailable" | "timeout" | "manual") {
    try {
      const r = await fetch("/api/courier/location/ip", { method: "POST" });
      if (gpsAlreadyEngaged()) {
        return false;
      }
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (reason === "denied") {
          setError(t("courier.err_gps_denied_ip_unavailable") + (data?.error || ""));
        } else {
          setError(t("courier.err_ip_unavailable") + (data?.error || ""));
        }
        return false;
      }
      const data = (await r.json()) as { lat: number; lng: number; city: string | null };
      if (gpsAlreadyEngaged()) {
        return false;
      }
      setPos({ lat: data.lat, lng: data.lng });
      setSource("ip");
      sourceRef.current = "ip";
      setAccuracy(null);
      setLastUpdatedAt(Date.now());
      setUpdateCount((n) => n + 1);
      setError(null);
      return true;
    } catch {
      setError(t("courier.err_ip_fetch_failed"));
      return false;
    }
  }

  function handleError(err: GeolocationPositionError) {
    setTracking(false);
    trackingRef.current = false;
    sourceRef.current = null;
    if (err.code === 1) {
      setError(t("courier.err_gps_denied"));
      void fallbackToIp("denied");
    } else if (err.code === 2) {
      setError(t("courier.err_gps_unavailable"));
      void fallbackToIp("unavailable");
    } else if (err.code === 3) {
      setError(t("courier.err_gps_timeout"));
      void fallbackToIp("timeout");
    } else {
      setError(t("courier.err_gps_generic"));
      void fallbackToIp("manual");
    }
  }

  useEffect(() => {
    trackingRef.current = tracking;
    if (!tracking) return;
    if (!navigator.geolocation) {
      setError(t("courier.err_browser_no_gps"));
      return;
    }
    const id = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
    });
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  useEffect(() => {
    if (ipFallbackTried.current) return;
    ipFallbackTried.current = true;
    void fallbackToIp("manual");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tracking) return;
    if (source !== "ip") return;
    const id = setInterval(() => {
      void fallbackToIp("manual");
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, source]);

  function toggleTracking() {
    if (tracking) {
      setTracking(false);
      trackingRef.current = false;
      return;
    }
    if (!navigator.geolocation) {
      setError(t("courier.err_browser_no_gps"));
      void fallbackToIp("manual");
      return;
    }
    trackingRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setError(null);
        handlePosition(p);
        setTracking(true);
      },
      handleError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function act(orderId: string, action: "accept" | "advance" | "deliver") {
    setActing(orderId + ":" + action);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || t("common.error"));
      return;
    }
    location.reload();
  }

  const mapCenter = pos ?? TEHRAN_CENTER;
  const onlineLabel = tracking
    ? t("courier.online_gps_precise")
    : source === "gps" && pos
    ? t("courier.online_gps")
    : source === "ip" && pos
    ? t("courier.online_ip")
    : pos
    ? t("courier.online")
    : t("courier.offline");

  void tick;
  const secondsAgo =
    lastUpdatedAt != null ? Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000)) : null;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("courier.panel")}</h1>
          <p className="text-sm text-gray-500">
            {t("courier.tracking_status")}:{" "}
            {pos ? (
              <span className="text-green-600">{onlineLabel}</span>
            ) : (
              <span className="text-gray-400">{onlineLabel}</span>
            )}
            {pos && <span className="mx-2 text-xs">({pos.lat.toFixed(5)}, {pos.lng.toFixed(5)})</span>}
            {profile?.lastIp && <span className="text-xs"> — IP: {profile.lastIp}</span>}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {secondsAgo == null ? (
              <span>{t("courier.not_updated_yet")}</span>
            ) : (
              <span>
                {t("courier.last_update", { seconds: secondsAgo })}
                {" — "}
                {t("courier.update_count", { count: updateCount })}
                {accuracy != null && (
                  <>
                    {" — "}
                    {t("courier.gps_accuracy", { meters: Math.round(accuracy) })}
                  </>
                )}
              </span>
            )}
          </p>
          {source === "ip" && !tracking && (
            <p className="mt-1 text-xs text-amber-700">{t("courier.ip_fallback_note")}</p>
          )}
          {tracking && (
            <p className="mt-1 text-xs text-green-700">{t("courier.live_tracking_active")}</p>
          )}
        </div>
        <button
          className={tracking ? "btn-outline" : "btn-primary"}
          onClick={toggleTracking}
        >
          {tracking ? t("courier.turn_off_gps") : t("courier.turn_on_gps")}
        </button>
      </div>

      {error && <div className="card p-3 text-sm text-amber-700">{error}</div>}

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">{t("courier.map")}</h2>
        <Map
          center={mapCenter}
          markers={pos ? [{ lat: pos.lat, lng: pos.lng, title: source === "ip" ? t("courier.your_approx_position") : t("courier.your_position") }] : []}
          recenter={pos != null}
          height={300}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("courier.my_active_orders")}</h2>
        <div className="space-y-3">
          {mine.map((o) => (
            <OrderCard key={o.id} order={o} acting={acting} act={act} mine t={t} locale={locale} />
          ))}
          {mine.length === 0 && <div className="card p-4 text-gray-500">{t("courier.no_active_orders")}</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("courier.available_orders")}</h2>
        <div className="space-y-3">
          {available.map((o) => (
            <OrderCard key={o.id} order={o} acting={acting} act={act} t={t} locale={locale} />
          ))}
          {available.length === 0 && <div className="card p-4 text-gray-500">{t("courier.no_available_orders")}</div>}
        </div>
      </section>
    </div>
  );
}

function OrderCard({
  order: o,
  acting,
  act,
  mine,
  t,
  locale,
}: {
  order: OrderLite;
  acting: string | null;
  act: (id: string, a: "accept" | "advance" | "deliver") => void;
  mine?: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: "en" | "fa";
}) {
  const next: { label: string; action: "advance" | "deliver" } | null =
    o.status === "ACCEPTED"
      ? { label: t("courier.start_preparing"), action: "advance" }
      : o.status === "PREPARING"
      ? { label: t("courier.on_the_way_action"), action: "advance" }
      : o.status === "ON_THE_WAY"
      ? { label: t("courier.delivered_action"), action: "deliver" }
      : null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{o.restaurant?.name || t("courier.supermarket_pickup")}</div>
          <div className="text-xs text-gray-500">{o.address?.fullText}</div>
        </div>
        <div className="text-left">
          <div className="text-xs text-gray-500">{t("courier.courier_service_fee")}</div>
          <div className="font-bold">{formatToman(o.courierFee, locale)}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
        {o.items.map((i, idx) => (
          <span key={idx} className="badge bg-gray-100 text-gray-700">{i.name} × {i.quantity}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="badge bg-brand-50 text-brand-700">{t(ORDER_STATUS_KEY[o.status as OrderStatus])}</span>
        <div className="flex gap-2">
          {!mine && (
            <button
              className="btn-primary text-sm"
              onClick={() => act(o.id, "accept")}
              disabled={acting === o.id + ":accept"}
            >
              {t("courier.accept_order")}
            </button>
          )}
          {mine && next && (
            <button
              className="btn-primary text-sm"
              onClick={() => act(o.id, next.action)}
              disabled={acting === o.id + ":" + next.action}
            >
              {next.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
