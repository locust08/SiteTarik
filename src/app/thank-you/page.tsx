import type { Metadata } from "next";
import { ThankYouPage } from "@/components/thank-you-page";

export const metadata: Metadata = {
  title: "Order Received | SiteTarik",
  description:
    "Your SiteTarik order is confirmed. We’re preparing your website handoff now.",
};

export default function ThankYouRoute() {
  return <ThankYouPage />;
}
