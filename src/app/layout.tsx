import type { Metadata } from "next";
import { bebas, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scarred Steel Co. Platform",
  description:
    "Scarred Steel Co. — CEO OS (internal operating system) and external Portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="scroll-steel">{children}</body>
    </html>
  );
}
