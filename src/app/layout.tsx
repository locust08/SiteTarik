import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteTarikAnalytics } from "@/components/site-tarik-analytics";
import { bodyFont } from "@/lib/manrope-font";
import { getSiteTarikAnalyticsConfig } from "@/lib/site-tarik-analytics";
import "./globals.css";

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
  const analyticsConfig = getSiteTarikAnalyticsConfig();

  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {analyticsConfig.hasGtm ? (
          <>
            <Script
              id="site-tarik-gtm-bootstrap"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
`,
              }}
            />
            <Script
              id="site-tarik-gtm"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtm.js?id=${analyticsConfig.gtmId}`}
            />
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${analyticsConfig.gtmId}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                aria-hidden="true"
                tabIndex={-1}
              />
            </noscript>
          </>
        ) : null}
        {!analyticsConfig.hasGtm && analyticsConfig.hasGa4 ? (
          <>
            <Script
              id="site-tarik-ga4"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.ga4MeasurementId}`}
            />
            <Script
              id="site-tarik-ga4-init"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${analyticsConfig.ga4MeasurementId}', { send_page_view: false });
`,
              }}
            />
          </>
        ) : null}
        {children}
        <Suspense fallback={null}>
          <SiteTarikAnalytics />
        </Suspense>
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
