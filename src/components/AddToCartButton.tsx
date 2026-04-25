"use client";

import { useCart, type CartItem } from "./CartProvider";
import { useT } from "@/i18n/client";

export function AddToCartButton({ item, disabled }: { item: CartItem; disabled?: boolean }) {
  const { add } = useCart();
  const t = useT();
  return (
    <button
      type="button"
      className="btn-primary px-3 py-1 text-sm"
      disabled={disabled}
      onClick={() => add(item)}
    >
      {t("common.add")}
    </button>
  );
}
