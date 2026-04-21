import Stripe from "stripe";

export function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add your Stripe test secret key to .env.local.");
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test-mode key that starts with sk_test_.");
  }

  return secretKey;
}

export function createStripeClient() {
  return new Stripe(getStripeSecretKey());
}
