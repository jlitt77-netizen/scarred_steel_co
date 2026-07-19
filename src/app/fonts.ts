import { Bebas_Neue, Inter } from "next/font/google";

// Headline / brand moments — bold condensed industrial (Section 6).
export const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
  // Fallback keeps the condensed character if the webfont can't load.
  fallback: ["Oswald", "Barlow Condensed", "Arial Narrow", "sans-serif"],
  adjustFontFallback: false,
});

// Body / data — highly readable modern sans (Section 6).
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
});
