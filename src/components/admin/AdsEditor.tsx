"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/client";

type Ad = { id: string; title: string; imageUrl: string; linkUrl: string | null; placement: string; isActive: boolean };

export function AdsEditor({ ads }: { ads: Ad[] }) {
  const router = useRouter();
  const t = useT();
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", placement: "HOME" });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.title || !form.imageUrl) return;
    setBusy(true);
    await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setForm({ title: "", imageUrl: "", linkUrl: "", placement: "HOME" });
    router.refresh();
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("common.confirm_delete"))) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <input className="input" placeholder={t("admin.ad_title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="input" placeholder={t("admin.ad_image")} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <input className="input" placeholder={t("admin.ad_link_optional")} value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
        <select className="input" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
          <option value="HOME">{t("admin.placement_home")}</option>
          <option value="CATEGORY">{t("admin.placement_category")}</option>
          <option value="RESTAURANT">{t("admin.placement_restaurant")}</option>
        </select>
        <button className="btn-primary sm:col-span-2" onClick={add} disabled={busy}>{t("admin.add_ad")}</button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {ads.map((a) => (
          <div key={a.id} className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.imageUrl} alt={a.title} className="h-32 w-full object-cover" />
            <div className="space-y-2 p-3">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-gray-500">{a.placement}</div>
              <div className="flex items-center justify-between">
                <button className="btn-outline px-2 py-1 text-xs" onClick={() => toggle(a.id, a.isActive)}>
                  {a.isActive ? t("common.deactivate") : t("common.activate")}
                </button>
                <button className="text-xs text-red-600 hover:underline" onClick={() => remove(a.id)}>{t("common.delete")}</button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && <div className="col-span-full text-gray-500">{t("admin.no_ads")}</div>}
      </div>
    </div>
  );
}
