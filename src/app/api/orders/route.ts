import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcOrderTotals } from "@/lib/money";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(["menu", "product"]),
        id: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  addressText: z.string().min(3),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { items, addressText, notes, discountCode } = parsed.data;

  // Resolve menu and product items
  const menuIds = items.filter((i) => i.kind === "menu").map((i) => i.id);
  const productIds = items.filter((i) => i.kind === "product").map((i) => i.id);
  const [menuItems, products] = await Promise.all([
    menuIds.length ? prisma.menuItem.findMany({ where: { id: { in: menuIds } } }) : Promise.resolve([]),
    productIds.length ? prisma.product.findMany({ where: { id: { in: productIds } } }) : Promise.resolve([]),
  ]);
  const menuMap = new Map(menuItems.map((m) => [m.id, m]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  let restaurantId: string | undefined;
  let itemsTotal = 0;
  const orderItemsData: { menuItemId?: string; productId?: string; name: string; unitPrice: number; quantity: number }[] = [];

  for (const it of items) {
    if (it.kind === "menu") {
      const m = menuMap.get(it.id);
      if (!m) return NextResponse.json({ error: "menu_item_not_found" }, { status: 400 });
      restaurantId = restaurantId || m.restaurantId;
      if (m.restaurantId !== restaurantId) {
        return NextResponse.json({ error: "multiple_restaurants" }, { status: 400 });
      }
      itemsTotal += m.price * it.quantity;
      orderItemsData.push({ menuItemId: m.id, name: m.name, unitPrice: m.price, quantity: it.quantity });
    } else {
      const p = productMap.get(it.id);
      if (!p) return NextResponse.json({ error: "product_not_found" }, { status: 400 });
      itemsTotal += p.price * it.quantity;
      orderItemsData.push({ productId: p.id, name: p.name, unitPrice: p.price, quantity: it.quantity });
    }
  }

  // Discount
  let discountAmount = 0;
  let promotion: { id: string; percentOff: number | null; amountOff: number | null; minOrderTotal: number; redemptions: number; maxRedemptions: number | null; isActive: boolean; startsAt: Date | null; endsAt: Date | null } | null = null;
  if (discountCode) {
    promotion = await prisma.promotion.findUnique({ where: { code: discountCode } });
    if (
      promotion &&
      promotion.isActive &&
      itemsTotal >= promotion.minOrderTotal &&
      (!promotion.startsAt || promotion.startsAt <= new Date()) &&
      (!promotion.endsAt || promotion.endsAt >= new Date()) &&
      (!promotion.maxRedemptions || promotion.redemptions < promotion.maxRedemptions)
    ) {
      if (promotion.percentOff) discountAmount = Math.round(itemsTotal * (promotion.percentOff / 100));
      else if (promotion.amountOff) discountAmount = promotion.amountOff;
    }
  }

  const totals = calcOrderTotals({ itemsTotal, discountAmount });

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      title: "Delivery",
      fullText: addressText,
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: session.user.id,
      restaurantId: restaurantId,
      addressId: address.id,
      status: "PENDING_PAYMENT",
      itemsTotal: totals.itemsTotal,
      commissionRate: totals.commissionRate,
      commissionFee: totals.commissionFee,
      courierFee: totals.courierFee,
      discountCode: discountCode || null,
      discountAmount: totals.discountAmount,
      total: totals.total,
      notes: notes || null,
      items: { create: orderItemsData },
      events: { create: { status: "PENDING_PAYMENT", note: "Order created" } },
    },
  });

  if (promotion && discountAmount > 0) {
    await prisma.promotion.update({
      where: { id: promotion.id },
      data: { redemptions: { increment: 1 } },
    });
  }

  // Stripe checkout if available, otherwise mock-confirm
  if (stripeEnabled && stripe) {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Order ${order.id}` },
            unit_amount: totals.total,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/orders/${order.id}?paid=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/orders/${order.id}?cancelled=1`,
      metadata: { orderId: order.id },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentRef: checkoutSession.id },
    });
    return NextResponse.json({ orderId: order.id, checkoutUrl: checkoutSession.url });
  }

  // Mock: mark as paid immediately
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID", events: { create: { status: "PAID", note: "Mock payment success" } } },
  });

  return NextResponse.json({ orderId: order.id, checkoutUrl: null });
}
