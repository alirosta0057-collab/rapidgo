"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Cat = { id: string; name: string; slug: string; kind: string };

export function CategoriesEditor({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState("FOOD");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name || !slug) return;
    setBusy(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, kind }),
    });
    setBusy(false);
    setName("");
    setSlug("");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">افزودن دسته</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input className="input" placeholder="نام" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="slug (مثلا food)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="FOOD">غذایی</option>
            <option value="HYGIENE">بهداشتی</option>
            <option value="SUPERSTORE">سوپرمارکت</option>
          </select>
          <button className="btn-primary" onClick={add} disabled={busy}>افزودن</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">نام</th>
              <th className="p-3">slug</th>
              <th className="p-3">نوع</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.slug}</td>
                <td className="p-3">{c.kind}</td>
                <td className="p-3 text-left">
                  <button className="text-xs text-red-600 hover:underline" onClick={() => remove(c.id)}>حذف</button>
                </td>
              </tr>
            ))}
            {initial.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={4}>دسته‌بندی‌ای نیست.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
