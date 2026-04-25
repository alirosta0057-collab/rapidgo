"use client";

import { useCart } from "@/components/CartProvider";
import { useSession } from "next-auth/react";
import { formatToman, calcOrderTotals } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/i18n/client";

export default function CheckoutPage() {
  const { items, itemsTotal, clear } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [addressText, setAddressText] = useState("");
  const [notes, setNotes] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  const totals = useMemo(
    () => calcOrderTotals({ itemsTotal, discountAmount }),
    [itemsTotal, discountAmount]
  );

  async function applyDiscount() {
    if (!discountCode) return;
    setValidating(true);
    setError(null);
    const res = await fetch(`/api/promotions/validate?code=${encodeURIComponent(discountCode)}&total=${itemsTotal}`);
    const data = await res.json();
    setValidating(false);
    if (!res.ok) {
      setDiscountAmount(0);
      setError(data.error || t("checkout.invalid_promo"));
      return;
    }
    setDiscountAmount(data.discountAmount);
  }

  async function placeOrder() {
    if (items.length === 0) return;
    if (!addressText.trim()) {
      setError(t("checkout.address_required"));
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          kind: i.kind,
          id: i.id,
          quantity: i.quantity,
        })),
        addressText,
        notes,
        discountCode: discountCode || undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || t("checkout.order_failed"));
      return;
    }
    clear();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      router.push(`/orders/${data.orderId}`);
    }
  }

  if (status === "loading") return <div>...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">{t("checkout.title")}</h1>

      {items.length === 0 ? (
        <div className="card p-6 text-center text-gray-500">{t("checkout.cart_empty")}</div>
      ) : (
        <>
          <div className="card space-y-4 p-4">
            <div>
              <label className="label">{t("checkout.delivery_address")}</label>
              <textarea className="input min-h-20" value={addressText} onChange={(e) => setAddressText(e.target.value)} />
            </div>
            <div>
              <label className="label">{t("checkout.notes_optional")}</label>
              <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="label">{t("checkout.promo_code")}</label>
              <div className="flex gap-2">
                <input className="input" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
                <button className="btn-outline" onClick={applyDiscount} disabled={validating}>
                  {validating ? "..." : t("common.apply")}
                </button>
              </div>
            </div>
          </div>

          <div className="card divide-y p-4">
            <Row label={t("checkout.items_total")} value={formatToman(totals.itemsTotal, locale)} />
            <Row
              label={t("checkout.site_commission", { rate: (totals.commissionRate * 100).toFixed(0) })}
              value={formatToman(totals.commissionFee, locale)}
              muted
            />
            <Row label={t("checkout.courier_fee")} value={formatToman(totals.courierFee, locale)} />
            {totals.discountAmount > 0 && (
              <Row label={t("checkout.discount")} value={`- ${formatToman(totals.discountAmount, locale)}`} accent />
            )}
            <Row label={t("checkout.total_payable")} value={formatToman(totals.total, locale)} bold />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button className="btn-primary w-full" onClick={placeOrder} disabled={submitting}>
            {submitting ? "..." : t("checkout.place_order")}
          </button>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold, muted, accent }: { label: string; value: string; bold?: boolean; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className={muted ? "text-gray-500" : ""}>{label}</span>
      <span className={`${bold ? "text-lg font-bold" : ""} ${accent ? "text-green-600" : ""}`}>{value}</span>
    </div>
  );
}
