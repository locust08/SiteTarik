import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { CivitasNotFound } from "@/components/civitas-not-found";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "404 | SiteTarik",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full">
        <CivitasNotFound />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
