import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = key
  ? new Stripe(key, { apiVersion: "2024-10-28.acacia" as Stripe.LatestApiVersion })
  : null;

export const stripeEnabled = Boolean(key);
