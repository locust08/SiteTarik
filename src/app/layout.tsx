import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SiteTarik | Get More From Your Website",
  description:
    "Turn your existing website into a cleaner, stronger lead-generating page with a simple upgrade flow.",
  icons: {
    icon: "/icon.png?v=20260411b",
    shortcut: "/icon.png?v=20260411b",
    apple: "/icon.png?v=20260411b",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
