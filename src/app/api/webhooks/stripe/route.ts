import { NextResponse } from "next/server";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  if (!stripeEnabled || !stripe) return NextResponse.json({ ok: false, reason: "stripe_disabled" });
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = secret && sig ? stripe.webhooks.constructEvent(body, sig, secret) : (JSON.parse(body) as Stripe.Event);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const cs = event.data.object as Stripe.Checkout.Session;
    const orderId = cs.metadata?.orderId;
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paymentRef: cs.id,
          events: { create: { status: "PAID", note: "Stripe checkout completed" } },
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
