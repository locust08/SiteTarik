import {
  getRequiredStripeSecretKey,
} from "@/lib/env";

export { getStripeEnvironmentSnapshot } from "@/lib/env";

type StripeApiOptions = {
  method?: "GET" | "POST";
  body?: URLSearchParams;
};

export async function stripeApiRequest<T>(
  path: string,
  { method = "GET", body }: StripeApiOptions = {},
): Promise<T> {
  const secretKey = getRequiredStripeSecretKey();
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body?.toString(),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Stripe request failed with status ${response.status}.`);
  }

  return payload as T;
}
