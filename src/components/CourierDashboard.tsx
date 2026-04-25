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
  const [tracking, setTracking] = useState<boolean>(profile?.isOnline ?? false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!tracking) return;
    if (!navigator.geolocation) {
      setError("مرورگر شما GPS پشتیبانی نمی‌کند.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setPos({ lat, lng });
        try {
          await fetch("/api/courier/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });
        } catch {}
      },
      (err) => setError(`خطای GPS: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [tracking]);

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
          onClick={() => setTracking(!tracking)}
        >
          {tracking ? "خاموش کردن GPS" : "روشن کردن GPS"}
        </button>
      </div>
      {error && <div className="card p-3 text-sm text-red-600">{error}</div>}

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
