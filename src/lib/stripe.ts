import Stripe from "stripe";
import { getRequiredStripeSecretKey } from "@/lib/env";
import { logServerEvent } from "@/lib/server-debug";

export function createStripeClient() {
  const secretKey = getRequiredStripeSecretKey();

  logServerEvent("stripe", "creating Stripe client", {
    hasSecretKey: true,
    keyMode: secretKey.startsWith("sk_live_") ? "live" : "test",
  });

  return new Stripe(secretKey, {
    // Cloudflare/OpenNext works more reliably with the Fetch-based client.
    httpClient: Stripe.createFetchHttpClient(fetch),
    // Keep the checkout request snappy for users instead of waiting the full default timeout.
    timeout: 15_000,
    maxNetworkRetries: 0,
  });
}

export { getStripeEnvironmentSnapshot } from "@/lib/env";
