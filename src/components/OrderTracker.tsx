"use client";

import { useEffect, useState } from "react";
import { Map } from "./MapDynamic";

export function OrderTracker({
  orderId,
  initialLat,
  initialLng,
}: {
  orderId: string;
  initialLat: number;
  initialLng: number;
}) {
  const [pos, setPos] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/courier/location?orderId=${orderId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.lastLat != null && data?.lastLng != null) {
          setPos({ lat: data.lastLat, lng: data.lastLng });
        }
      } catch {}
    };
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderId]);

  return <Map center={pos} markers={[{ lat: pos.lat, lng: pos.lng, title: "موقعیت پیک" }]} recenter height={320} />;
}
