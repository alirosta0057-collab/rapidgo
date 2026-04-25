"use client";

import { useCart, type CartItem } from "./CartProvider";

export function AddToCartButton({ item, disabled }: { item: CartItem; disabled?: boolean }) {
  const { add } = useCart();
  return (
    <button
      type="button"
      className="btn-primary px-3 py-1 text-sm"
      disabled={disabled}
      onClick={() => add(item)}
    >
      افزودن
    </button>
  );
}
