"use client";

import { useEffect, useRef, useState } from "react";
import { Map } from "./MapDynamic";
import { ORDER_STATUS_FA, OrderStatus } from "@/lib/roles";
import { formatToman } from "@/lib/money";

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

  function handlePosition(p: GeolocationPosition) {
    const lat = p.coords.latitude;
    const lng = p.coords.longitude;
    setPos({ lat, lng });
    setSource("gps");
    setAccuracy(p.coords.accuracy ?? null);
    setLastUpdatedAt(Date.now());
    setUpdateCount((n) => n + 1);
    fetch("/api/courier/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    }).catch(() => {});
  }

  async function fallbackToIp(reason: "denied" | "unavailable" | "timeout" | "manual") {
    try {
      const r = await fetch("/api/courier/location/ip", { method: "POST" });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (reason === "denied") {
          setError("دسترسی GPS رد شد و موقعیت IP هم در دسترس نیست. " + (data?.error || ""));
        } else {
          setError("موقعیت IP در دسترس نیست. " + (data?.error || ""));
        }
        return false;
      }
      const data = (await r.json()) as { lat: number; lng: number; city: string | null };
      setPos({ lat: data.lat, lng: data.lng });
      setSource("ip");
      setAccuracy(null);
      setLastUpdatedAt(Date.now());
      setUpdateCount((n) => n + 1);
      setError(null);
      return true;
    } catch {
      setError("خطا در دریافت موقعیت IP.");
      return false;
    }
  }

  function handleError(err: GeolocationPositionError) {
    // Stop the watcher on any error so watchPosition doesn't keep firing the
    // error callback and trigger unbounded IP fallback requests.
    setTracking(false);
    if (err.code === 1) {
      setError("دسترسی GPS رد شد. در حال دریافت موقعیت تقریبی از IP…");
      void fallbackToIp("denied");
    } else if (err.code === 2) {
      setError("GPS دستگاه در دسترس نیست. در حال دریافت موقعیت تقریبی از IP…");
      void fallbackToIp("unavailable");
    } else if (err.code === 3) {
      setError("دریافت GPS طول کشید. در حال دریافت موقعیت تقریبی از IP…");
      void fallbackToIp("timeout");
    } else {
      setError("خطا در دریافت GPS. در حال دریافت موقعیت تقریبی از IP…");
      void fallbackToIp("manual");
    }
  }

  useEffect(() => {
    if (!tracking) return;
    if (!navigator.geolocation) {
      setError("مرورگر شما GPS پشتیبانی نمی‌کند.");
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
    if (pos != null) return;
    ipFallbackTried.current = true;
    void fallbackToIp("manual");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick once a second so the "X seconds ago" label keeps moving even between updates.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // While we're falling back to IP (no GPS), refresh the IP location every 30s
  // so the courier still has a periodic heartbeat. Real-time precision still
  // requires the user to grant GPS permission.
  useEffect(() => {
    if (tracking) return;
    if (source !== "ip") return;
    const id = setInterval(() => {
      void fallbackToIp("manual");
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, source]);

  function toggleTracking() {
    if (tracking) {
      setTracking(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("مرورگر شما GPS پشتیبانی نمی‌کند.");
      void fallbackToIp("manual");
      return;
    }
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
      alert(data.error || "خطا");
      return;
    }
    location.reload();
  }

  const mapCenter = pos ?? TEHRAN_CENTER;
  const onlineLabel = tracking
    ? "آنلاین (GPS دقیق)"
    : source === "gps" && pos
    ? "آنلاین (GPS)"
    : source === "ip" && pos
    ? "آنلاین (تقریبی از IP)"
    : pos
    ? "آنلاین"
    : "آفلاین";

  // tick is intentionally read so the JSX re-renders every second and the
  // "X seconds ago" label stays current.
  void tick;
  const secondsAgo =
    lastUpdatedAt != null ? Math.max(0, Math.floor((Date.now() - lastUpdatedAt) / 1000)) : null;

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">پنل پیک</h1>
          <p className="text-sm text-gray-500">
            وضعیت ردیابی:{" "}
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
              <span>هنوز به‌روزرسانی نشده</span>
            ) : (
              <span>
                آخرین به‌روزرسانی: <span className="font-mono">{secondsAgo}</span> ثانیه پیش
                {" — "}
                تعداد کل: <span className="font-mono">{updateCount}</span>
                {accuracy != null && (
                  <>
                    {" — "}
                    دقت GPS: <span className="font-mono">{Math.round(accuracy)}m</span>
                  </>
                )}
              </span>
            )}
          </p>
          {source === "ip" && !tracking && (
            <p className="mt-1 text-xs text-amber-700">
              این موقعیت تقریبی از روی IP است (هر ۳۰ ثانیه refresh می‌شود). برای ردیابی زنده و دقیق روی «روشن کردن GPS» بزنید و در popup مرورگر Allow بزنید.
            </p>
          )}
          {tracking && (
            <p className="mt-1 text-xs text-green-700">
              ردیابی زنده فعال است. هر تغییر موقعیت GPS automatically روی نقشه و سرور به‌روزرسانی می‌شود.
            </p>
          )}
        </div>
        <button
          className={tracking ? "btn-outline" : "btn-primary"}
          onClick={toggleTracking}
        >
          {tracking ? "خاموش کردن GPS" : "روشن کردن GPS"}
        </button>
      </div>

      {error && <div className="card p-3 text-sm text-amber-700">{error}</div>}

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">نقشه</h2>
        <Map
          center={mapCenter}
          markers={pos ? [{ lat: pos.lat, lng: pos.lng, title: source === "ip" ? "موقعیت تقریبی شما" : "شما" }] : []}
          recenter={pos != null}
          height={300}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">سفارش‌های در حال انجام شما</h2>
        <div className="space-y-3">
          {mine.map((o) => (
            <OrderCard key={o.id} order={o} acting={acting} act={act} mine />
          ))}
          {mine.length === 0 && <div className="card p-4 text-gray-500">سفارش فعالی ندارید.</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">سفارش‌های موجود برای پذیرش</h2>
        <div className="space-y-3">
          {available.map((o) => (
            <OrderCard key={o.id} order={o} acting={acting} act={act} />
          ))}
          {available.length === 0 && <div className="card p-4 text-gray-500">سفارشی موجود نیست.</div>}
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
}: {
  order: OrderLite;
  acting: string | null;
  act: (id: string, a: "accept" | "advance" | "deliver") => void;
  mine?: boolean;
}) {
  const next: { label: string; action: "advance" | "deliver" } | null =
    o.status === "ACCEPTED"
      ? { label: "شروع تهیه", action: "advance" }
      : o.status === "PREPARING"
      ? { label: "در راه (شروع حرکت)", action: "advance" }
      : o.status === "ON_THE_WAY"
      ? { label: "تحویل شد", action: "deliver" }
      : null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{o.restaurant?.name || "خرید سوپرمارکت"}</div>
          <div className="text-xs text-gray-500">{o.address?.fullText}</div>
        </div>
        <div className="text-left">
          <div className="text-xs text-gray-500">حق سرویس پیک</div>
          <div className="font-bold">{formatToman(o.courierFee)}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
        {o.items.map((i, idx) => (
          <span key={idx} className="badge bg-gray-100 text-gray-700">{i.name} × {i.quantity}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="badge bg-brand-50 text-brand-700">{ORDER_STATUS_FA[o.status as OrderStatus]}</span>
        <div className="flex gap-2">
          {!mine && (
            <button
              className="btn-primary text-sm"
              onClick={() => act(o.id, "accept")}
              disabled={acting === o.id + ":accept"}
            >
              قبول سفارش
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
