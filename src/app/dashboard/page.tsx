import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SiteTarik | Customer Dashboard",
  description: "Stripe-backed SiteTarik customer dashboard for paid Core Reborn and SEO Enhancement orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardClient initialNeedsLogin />;
}
