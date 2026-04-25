"use client";

import dynamic from "next/dynamic";

export const Map = dynamic(() => import("./Map").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <div className="grid h-64 w-full place-items-center rounded-xl bg-gray-100">Loading map…</div>,
});
