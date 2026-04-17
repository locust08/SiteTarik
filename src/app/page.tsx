import type { Metadata } from "next";
import { CivitasPage } from "@/components/civitas-page";

export const metadata: Metadata = {
  title: "SiteTarik | Upgrade Your Website for More Leads",
  description:
    "Refresh your existing website, add basic SEO, and move visitors toward payment with a simple process.",
};

export default function Home() {
  return <CivitasPage />;
}
