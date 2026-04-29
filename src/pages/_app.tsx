import type { AppProps } from "next/app";
import Head from "next/head";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { bodyFont } from "@/lib/manrope-font";
import "@/app/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${bodyFont.variable} min-h-full antialiased`}>
      <Head>
        <link rel="icon" href="/icon.png?v=20260411b" />
        <link rel="shortcut icon" href="/icon.png?v=20260411b" />
        <link rel="apple-touch-icon" href="/icon.png?v=20260411b" />
      </Head>
      <Component {...pageProps} />
      <FloatingWhatsApp />
    </div>
  );
}
