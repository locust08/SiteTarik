import type { Metadata } from "next";
import { CivitasPage } from "@/components/civitas-page";

export const metadata: Metadata = {
  title: "SiteTarik | WordPress & CMS Website Upgrade for Small Business",
  description:
    "One-to-one website refresh for small business WordPress, Drupal, Joomla, and similar CMS sites, with basic SEO or the SEO Enhancement 12-page blog add-on.",
};

export default function Home() {
  return <CivitasPage />;
}
