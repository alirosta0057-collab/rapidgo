"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password, callbackUrl });
    setLoading(false);
    if (res?.error) setError(t("auth.invalid_credentials"));
    else if (res?.ok) router.push(callbackUrl);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label">{t("common.email")}</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">{t("common.password")}</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "..." : t("header.sign_in")}
      </button>
      <div className="text-center text-sm text-gray-600">
        {t("auth.no_account")}{" "}
        <Link href="/register" className="text-brand-700 hover:underline">{t("header.sign_up")}</Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <LoginPageHeader />
      <Suspense fallback={<div className="card p-6">...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginPageHeader() {
  const t = useT();
  return <h1 className="mb-6 text-2xl font-bold">{t("auth.login_title")}</h1>;
}
