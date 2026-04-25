"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

const ROLES = [
  { value: "CUSTOMER", label: "مشتری" },
  { value: "COURIER", label: "پیک موتوری" },
  { value: "RESTAURANT", label: "صاحب رستوران" },
];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get("role") || "CUSTOMER";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      setError(data.error || "خطا در ثبت‌نام");
      return;
    }
    const signInRes = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (signInRes?.ok) {
      if (role === "RESTAURANT") router.push("/restaurant/setup");
      else if (role === "COURIER") router.push("/courier");
      else router.push("/");
    } else {
      router.push("/login");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label">نام و نام‌خانوادگی</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">ایمیل</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">شماره موبایل</label>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="label">رمز عبور</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <div>
        <label className="label">نوع حساب</label>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "..." : "ثبت‌نام"}
      </button>
      <div className="text-center text-sm text-gray-600">
        حساب دارید؟ <Link href="/login" className="text-brand-700 hover:underline">ورود</Link>
      </div>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">ثبت‌نام</h1>
      <Suspense fallback={<div className="card p-6">...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
