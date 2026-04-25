"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatToman } from "@/lib/money";

type Product = { id: string; name: string; price: number; stock: number; imageUrl: string | null; category: { name: string } };
type Category = { id: string; name: string };

export function ProductsEditor({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: "",
    categoryId: categories[0]?.id || "",
  });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.name || !form.categoryId) return;
    setBusy(true);
    await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setForm({ ...form, name: "", description: "", price: 0, stock: 0, imageUrl: "" });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input className="input" placeholder="نام محصول" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="توضیحات" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" placeholder="قیمت (تومان)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input" type="number" placeholder="موجودی" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <input className="input" placeholder="آدرس تصویر (اختیاری)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn-primary sm:col-span-3" onClick={add} disabled={busy}>افزودن محصول</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">نام</th>
              <th className="p-3">دسته</th>
              <th className="p-3">قیمت</th>
              <th className="p-3">موجودی</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category.name}</td>
                <td className="p-3">{formatToman(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-left">
                  <button className="text-xs text-red-600 hover:underline" onClick={() => remove(p.id)}>حذف</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={5}>محصولی نیست.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
