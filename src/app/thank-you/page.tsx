import type { Metadata } from "next";
import { ThankYouPage } from "@/components/thank-you-page";

export const metadata: Metadata = {
  title: "Order Received | SiteTarik",
  description:
    "Your SiteTarik order is confirmed. We’re preparing your website handoff now.",
};

type ThankYouRouteProps = {
  searchParams?: Promise<{
    checkout?: string | string[];
    session_id?: string | string[];
  }>;
};

export default async function ThankYouRoute({ searchParams }: ThankYouRouteProps) {
  const params = searchParams ? await searchParams : {};
  const checkout = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  const sessionId = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;

  return <ThankYouPage stripeSessionId={sessionId} isActiveCheckout={checkout === "success"} />;
}
