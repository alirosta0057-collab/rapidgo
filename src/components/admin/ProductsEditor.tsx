"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatToman } from "@/lib/money";
import { useLocale } from "@/i18n/client";

type Product = { id: string; name: string; price: number; stock: number; imageUrl: string | null; category: { name: string } };
type Category = { id: string; name: string };

export function ProductsEditor({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const { t, locale } = useLocale();
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
    if (!confirm(t("common.confirm_delete"))) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input className="input" placeholder={t("admin.product_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder={t("common.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="number" placeholder={t("admin.product_price")} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="input" type="number" placeholder={t("admin.product_stock")} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
        <input className="input" placeholder={t("common.image_url_optional")} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn-primary sm:col-span-3" onClick={add} disabled={busy}>{t("admin.add_product")}</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">{t("common.name")}</th>
              <th className="p-3">{t("admin.col_category")}</th>
              <th className="p-3">{t("admin.col_price")}</th>
              <th className="p-3">{t("admin.col_stock")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.category.name}</td>
                <td className="p-3">{formatToman(p.price, locale)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-left">
                  <button className="text-xs text-red-600 hover:underline" onClick={() => remove(p.id)}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={5}>{t("admin.no_products")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
