import localFont from "next/font/local";

export const bodyFont = localFont({
  src: "../fonts/manrope/manrope-latin.woff2",
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});
