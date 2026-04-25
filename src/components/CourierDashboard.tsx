"use client";

import { useEffect, useState } from "react";
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
  const [tracking, setTracking] = useState<boolean>(false);
  const [permDenied, setPermDenied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  function handlePosition(p: GeolocationPosition) {
    const lat = p.coords.latitude;
    const lng = p.coords.longitude;
    setPos({ lat, lng });
    fetch("/api/courier/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    }).catch(() => {});
  }

  function handleError(err: GeolocationPositionError) {
    if (err.code === 1) {
      // PERMISSION_DENIED — show actionable UI instead of a tiny message.
      setPermDenied(true);
      setTracking(false);
      setError(null);
    } else if (err.code === 2) {
      setPermDenied(false);
      setError("موقعیت در دسترس نیست. آیا GPS دستگاه روشن است؟");
    } else if (err.code === 3) {
      setPermDenied(false);
      setError("دریافت موقعیت طول کشید. دوباره امتحان کنید.");
    } else {
      setPermDenied(false);
      setError(`خطای GPS: ${err.message || "نامشخص"}`);
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

  function toggleTracking() {
    if (tracking) {
      setTracking(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("مرورگر شما GPS پشتیبانی نمی‌کند.");
      return;
    }
    // Call getCurrentPosition synchronously inside the click handler so iOS
    // Safari treats it as user-initiated. Avoid any React state updates
    // before this call — they can break the user-gesture chain.
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPermDenied(false);
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

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">پنل پیک</h1>
          <p className="text-sm text-gray-500">
            وضعیت ردیابی: {tracking ? <span className="text-green-600">آنلاین</span> : <span className="text-gray-400">آفلاین</span>}
            {pos && <span className="mx-2 text-xs">({pos.lat.toFixed(5)}, {pos.lng.toFixed(5)})</span>}
            {profile?.lastIp && <span className="text-xs"> — IP: {profile.lastIp}</span>}
          </p>
        </div>
        <button
          className={tracking ? "btn-outline" : "btn-primary"}
          onClick={toggleTracking}
        >
          {tracking ? "خاموش کردن GPS" : "روشن کردن GPS"}
        </button>
      </div>
      {permDenied && (
        <div className="card space-y-2 p-4 text-sm">
          <div className="font-semibold text-red-600">دسترسی به موقعیت رد شده است</div>
          <p className="text-gray-700">
            مرورگر شما اجازه دسترسی به GPS را برای این سایت بسته است. برای فعال کردن:
          </p>
          <ol className="list-inside list-decimal space-y-1 text-gray-700">
            <li>در Safari آیفون: روی آیکون <span dir="ltr" className="font-mono">aA</span> کنار آدرس → <span className="font-semibold">Website Settings</span> → <span className="font-semibold">Location</span> → <span className="font-semibold">Allow</span></li>
            <li>در Chrome دسکتاپ: روی قفل کنار آدرس → <span className="font-semibold">Site settings</span> → <span className="font-semibold">Location</span> → <span className="font-semibold">Allow</span></li>
            <li>سپس صفحه را بسته و دوباره باز کنید، و دکمه «روشن کردن GPS» را بزنید.</li>
          </ol>
          <p className="text-gray-500">
            مطمئن شوید Location Services در تنظیمات دستگاه برای مرورگر روشن است.
          </p>
        </div>
      )}
      {error && !permDenied && <div className="card p-3 text-sm text-red-600">{error}</div>}

      {pos && (
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">نقشه</h2>
          <Map center={pos} markers={[{ lat: pos.lat, lng: pos.lng, title: "شما" }]} recenter height={300} />
        </div>
      )}

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
