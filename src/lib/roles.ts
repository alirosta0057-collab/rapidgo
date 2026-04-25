export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  COURIER: "COURIER",
  RESTAURANT: "RESTAURANT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  ON_THE_WAY: "ON_THE_WAY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Translation key suffix for an order status. Use with `status.<key>`
 * (e.g. `t("status.PENDING_PAYMENT")`). Kept for callers that want
 * a plain string mapping without going through i18n at point of use.
 */
export const ORDER_STATUS_KEY: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "status.PENDING_PAYMENT",
  PAID: "status.PAID",
  ACCEPTED: "status.ACCEPTED",
  PREPARING: "status.PREPARING",
  ON_THE_WAY: "status.ON_THE_WAY",
  DELIVERED: "status.DELIVERED",
  CANCELLED: "status.CANCELLED",
};

export const COURIER_NEXT_STATUS: Record<string, OrderStatus | null> = {
  PAID: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "ON_THE_WAY",
  ON_THE_WAY: "DELIVERED",
};
