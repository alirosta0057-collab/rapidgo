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

export const ORDER_STATUS_FA: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  ACCEPTED: "پذیرفته شد",
  PREPARING: "در حال تهیه",
  ON_THE_WAY: "پیک در راه",
  DELIVERED: "تحویل شد",
  CANCELLED: "لغو شد",
};

export const COURIER_NEXT_STATUS: Record<string, OrderStatus | null> = {
  PAID: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "ON_THE_WAY",
  ON_THE_WAY: "DELIVERED",
};
