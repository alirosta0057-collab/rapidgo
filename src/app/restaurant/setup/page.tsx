"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RestaurantSetupPage() {
  const router = useRouter();
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
      setError("نام، اسلاگ و آدرس الزامی است.");
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
      setError(data.error || "خطا");
      return;
    }
    router.push(`/restaurant`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">ثبت رستوران</h1>
      <div className="card space-y-3 p-4">
        <input className="input" placeholder="نام رستوران" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="slug (آدرس URL)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <textarea className="input" placeholder="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="input" placeholder="شماره تماس" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn-primary w-full" onClick={submit} disabled={busy}>
          {busy ? "..." : "ثبت رستوران"}
        </button>
        <p className="text-xs text-gray-500">پس از تایید توسط ادمین، رستوران در سایت نمایش داده می‌شود.</p>
      </div>
    </div>
  );
}
