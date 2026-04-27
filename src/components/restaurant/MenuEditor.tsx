"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatToman } from "@/lib/money";
import { useLocale } from "@/i18n/client";

type MenuItem = { id: string; name: string; price: number; description: string | null; isAvailable: boolean; imageUrl: string | null };

export function MenuEditor({ restaurantId, initial }: { restaurantId: string; initial: MenuItem[] }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [form, setForm] = useState({ name: "", price: 0, description: "", imageUrl: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function add() {
    if (!form.name || form.price <= 0) return;
    setBusy(true);
    await fetch(`/api/restaurants/${restaurantId}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setForm({ name: "", price: 0, description: "", imageUrl: "" });
    router.refresh();
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        setUploadError(t("menu_editor.image_upload_failed"));
      }
    } catch {
      setUploadError(t("menu_editor.image_upload_failed"));
    } finally {
      setUploading(false);
    }
  }

  async function toggle(id: string, isAvailable: boolean) {
    await fetch(`/api/restaurants/${restaurantId}/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("common.confirm_delete"))) return;
    await fetch(`/api/restaurants/${restaurantId}/menu/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <input className="input" placeholder={t("menu_editor.item_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="number" placeholder={t("menu_editor.price")} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input sm:col-span-2" placeholder={t("menu_editor.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input sm:col-span-2" placeholder={t("menu_editor.image_url_optional")} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <label className="btn-outline cursor-pointer text-center sm:col-span-2">
          {uploading ? t("menu_editor.image_uploading") : t("menu_editor.image_upload_button")}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {uploadError && <div className="text-sm text-red-600 sm:col-span-2">{uploadError}</div>}
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="" className="h-24 w-24 rounded object-cover sm:col-span-2" />
        )}
        <button className="btn-primary sm:col-span-2" onClick={add} disabled={busy}>{t("menu_editor.add_item")}</button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {initial.map((m) => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-gray-500">{m.description}</div>
                <div className="mt-1 font-semibold text-brand-700">{formatToman(m.price, locale)}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button className="btn-outline px-2 py-1 text-xs" onClick={() => toggle(m.id, m.isAvailable)}>
                  {m.isAvailable ? t("common.deactivate") : t("common.activate")}
                </button>
                <button className="text-xs text-red-600 hover:underline" onClick={() => remove(m.id)}>{t("common.delete")}</button>
              </div>
            </div>
          </div>
        ))}
        {initial.length === 0 && <div className="text-gray-500">{t("menu_editor.no_items")}</div>}
      </div>
    </div>
  );
}
