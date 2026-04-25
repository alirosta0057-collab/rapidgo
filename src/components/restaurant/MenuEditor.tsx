"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatToman } from "@/lib/money";

type MenuItem = { id: string; name: string; price: number; description: string | null; isAvailable: boolean; imageUrl: string | null };

export function MenuEditor({ restaurantId, initial }: { restaurantId: string; initial: MenuItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", price: 0, description: "", imageUrl: "" });
  const [busy, setBusy] = useState(false);

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

  async function toggle(id: string, isAvailable: boolean) {
    await fetch(`/api/restaurants/${restaurantId}/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/restaurants/${restaurantId}/menu/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
        <input className="input" placeholder="نام آیتم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="number" placeholder="قیمت (تومان)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input sm:col-span-2" placeholder="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input sm:col-span-2" placeholder="آدرس تصویر (اختیاری)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <button className="btn-primary sm:col-span-2" onClick={add} disabled={busy}>افزودن آیتم</button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {initial.map((m) => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-gray-500">{m.description}</div>
                <div className="mt-1 font-semibold text-brand-700">{formatToman(m.price)}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button className="btn-outline px-2 py-1 text-xs" onClick={() => toggle(m.id, m.isAvailable)}>
                  {m.isAvailable ? "غیرفعال" : "فعال"}
                </button>
                <button className="text-xs text-red-600 hover:underline" onClick={() => remove(m.id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
        {initial.length === 0 && <div className="text-gray-500">آیتمی ثبت نشده.</div>}
      </div>
    </div>
  );
}
