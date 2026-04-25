"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Promotion = { id: string; code: string; percentOff: number | null; amountOff: number | null; isActive: boolean };
type Festival = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  promotions: Promotion[];
};

export function FestivalsEditor({ festivals }: { festivals: Festival[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [promo, setPromo] = useState<Record<string, { code: string; percentOff: string; amountOff: string; minOrderTotal: string }>>(
    {}
  );
  const [busy, setBusy] = useState(false);

  async function addFestival() {
    if (!form.title || !form.slug) return;
    setBusy(true);
    await fetch("/api/admin/festivals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setForm({ ...form, title: "", slug: "", description: "" });
    router.refresh();
  }

  async function addPromo(festivalId: string) {
    const p = promo[festivalId];
    if (!p?.code) return;
    await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        festivalId,
        code: p.code.toUpperCase(),
        percentOff: p.percentOff ? Number(p.percentOff) : null,
        amountOff: p.amountOff ? Number(p.amountOff) : null,
        minOrderTotal: p.minOrderTotal ? Number(p.minOrderTotal) : 0,
      }),
    });
    setPromo({ ...promo, [festivalId]: { code: "", percentOff: "", amountOff: "", minOrderTotal: "" } });
    router.refresh();
  }

  async function removePromo(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function removeFestival(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/admin/festivals/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">جشنواره جدید</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className="input" placeholder="عنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" placeholder="slug (مثلا nowruz)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="input" placeholder="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="input" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <input className="input" type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          <button className="btn-primary" onClick={addFestival} disabled={busy}>افزودن</button>
        </div>
      </div>

      <div className="space-y-4">
        {festivals.map((f) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">{f.title}</div>
                <div className="text-xs text-gray-500">/{f.slug} — {new Date(f.startsAt).toLocaleDateString("fa-IR")} تا {new Date(f.endsAt).toLocaleDateString("fa-IR")}</div>
              </div>
              <button className="text-xs text-red-600 hover:underline" onClick={() => removeFestival(f.id)}>حذف جشنواره</button>
            </div>

            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-semibold">کدهای تخفیف</h3>
              {f.promotions.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span className="font-mono">{p.code}</span>
                  <span>
                    {p.percentOff ? `${p.percentOff}٪` : p.amountOff ? `${p.amountOff} تومان` : "-"}
                  </span>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => removePromo(p.id)}>حذف</button>
                </div>
              ))}

              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-5">
                <input className="input" placeholder="کد" value={promo[f.id]?.code || ""} onChange={(e) => setPromo({ ...promo, [f.id]: { ...(promo[f.id] || { code: "", percentOff: "", amountOff: "", minOrderTotal: "" }), code: e.target.value } })} />
                <input className="input" type="number" placeholder="درصد تخفیف" value={promo[f.id]?.percentOff || ""} onChange={(e) => setPromo({ ...promo, [f.id]: { ...(promo[f.id] || { code: "", percentOff: "", amountOff: "", minOrderTotal: "" }), percentOff: e.target.value } })} />
                <input className="input" type="number" placeholder="مبلغ تخفیف" value={promo[f.id]?.amountOff || ""} onChange={(e) => setPromo({ ...promo, [f.id]: { ...(promo[f.id] || { code: "", percentOff: "", amountOff: "", minOrderTotal: "" }), amountOff: e.target.value } })} />
                <input className="input" type="number" placeholder="حداقل سفارش" value={promo[f.id]?.minOrderTotal || ""} onChange={(e) => setPromo({ ...promo, [f.id]: { ...(promo[f.id] || { code: "", percentOff: "", amountOff: "", minOrderTotal: "" }), minOrderTotal: e.target.value } })} />
                <button className="btn-primary" onClick={() => addPromo(f.id)}>افزودن کد</button>
              </div>
            </div>
          </div>
        ))}
        {festivals.length === 0 && <div className="card p-6 text-gray-500">جشنواره‌ای ثبت نشده.</div>}
      </div>
    </div>
  );
}
