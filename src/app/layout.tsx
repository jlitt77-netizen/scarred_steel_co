import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
