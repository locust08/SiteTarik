import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteTarikAnalytics } from "@/components/site-tarik-analytics";
import { bodyFont } from "@/lib/manrope-font";
import { getSiteTarikAnalyticsConfig } from "@/lib/site-tarik-analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "CMS Website Upgrade Malaysia | Basic SEO, GTM & GA4 Setup",
  description:
    "Upgrade your existing WordPress, Joomla, Drupal, or CMS website with proper basic SEO, GTM, GA4, ads tracking readiness, hosting, and WhatsApp delivery from RM100/year.",
  keywords: [
    "CMS website upgrade Malaysia",
    "basic SEO setup Malaysia",
    "WordPress SEO setup Malaysia",
    "CMS website SEO setup",
    "website SEO setup service Malaysia",
    "GTM GA4 setup Malaysia",
    "Google Tag Manager setup Malaysia",
    "Google Analytics 4 setup Malaysia",
    "ads tracking setup website",
    "SEO ready website setup Malaysia",
    "existing website SEO setup",
    "small business SEO setup Malaysia",
    "WordPress website SEO setup",
    "website tracking setup Malaysia",
    "website upgrade service Malaysia",
  ],
  icons: {
    icon: "/icon.png?v=20260515b",
    shortcut: "/icon.png?v=20260515b",
    apple: "/icon.png?v=20260515b",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsConfig = getSiteTarikAnalyticsConfig();
  const shouldLoadDirectGa4 = analyticsConfig.shouldUseDirectGa4;
  const analyticsRuntimeConfigJson = JSON.stringify({
    gtmId: analyticsConfig.gtmId,
    ga4MeasurementId: analyticsConfig.ga4MeasurementId,
  });

  return (
    <html lang="en" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Script
          id="site-tarik-analytics-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__SITE_TARIK_ANALYTICS__ = ${analyticsRuntimeConfigJson};`,
          }}
        />
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
        {shouldLoadDirectGa4 ? (
          <>
            <Script
              id="site-tarik-ga4-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.ga4MeasurementId}`}
            />
            <Script
              id="site-tarik-ga4-bootstrap"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
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
