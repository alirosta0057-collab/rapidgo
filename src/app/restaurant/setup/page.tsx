"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/client";

export default function RestaurantSetupPage() {
  const router = useRouter();
  const t = useT();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!form.name || !form.slug || !form.address) {
      setError(t("restaurant_panel.name_slug_address_required"));
      return;
    }
    setBusy(true);
    const res = await fetch("/api/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("common.error"));
      return;
    }
    router.push(`/restaurant`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">{t("restaurant_panel.setup_title")}</h1>
      <div className="card space-y-3 p-4">
        <input className="input" placeholder={t("restaurant_panel.name_placeholder")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder={t("restaurant_panel.slug_placeholder")} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea className="input" placeholder={t("restaurant_panel.description_placeholder")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder={t("restaurant_panel.address_placeholder")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="input" placeholder={t("restaurant_panel.phone_placeholder")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn-primary w-full" onClick={submit} disabled={busy}>
          {busy ? "..." : t("restaurant_panel.submit")}
        </button>
        <p className="text-xs text-gray-500">{t("restaurant_panel.after_approval_note")}</p>
      </div>
    </div>
  );
}
