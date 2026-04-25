"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useT } from "@/i18n/client";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const initialRole = params.get("role") || "CUSTOMER";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ROLES = useMemo(
    () => [
      { value: "CUSTOMER", label: t("auth.role_customer") },
      { value: "COURIER", label: t("auth.role_courier") },
      { value: "RESTAURANT", label: t("auth.role_restaurant") },
    ],
    [t]
  );

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
      setError(data.error || t("auth.register_error"));
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
        <label className="label">{t("auth.full_name")}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">{t("common.email")}</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">{t("auth.mobile_number")}</label>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="label">{t("common.password")}</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <div>
        <label className="label">{t("auth.account_type")}</label>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "..." : t("header.sign_up")}
      </button>
      <div className="text-center text-sm text-gray-600">
        {t("auth.have_account")}{" "}
        <Link href="/login" className="text-brand-700 hover:underline">{t("header.sign_in")}</Link>
      </div>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <RegisterPageHeader />
      <Suspense fallback={<div className="card p-6">...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

function RegisterPageHeader() {
  const t = useT();
  return <h1 className="mb-6 text-2xl font-bold">{t("auth.register_title")}</h1>;
}
