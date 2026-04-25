export function formatToman(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

export function calcOrderTotals(opts: {
  itemsTotal: number;
  commissionRate?: number;
  courierFee?: number;
  discountAmount?: number;
}) {
  const commissionRate = opts.commissionRate ?? Number(process.env.COMMISSION_RATE || 0.1);
  const courierFee = opts.courierFee ?? Number(process.env.COURIER_SERVICE_FEE || 20000);
  const discountAmount = opts.discountAmount ?? 0;
  const commissionFee = Math.round(opts.itemsTotal * commissionRate);
  const total = Math.max(0, opts.itemsTotal + courierFee - discountAmount);
  return {
    itemsTotal: opts.itemsTotal,
    commissionRate,
    commissionFee,
    courierFee,
    discountAmount,
    total,
  };
}
