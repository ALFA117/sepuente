import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SEPuente – Anchor SEP-24 para pesos mexicanos",
  description:
    "Gateway open source no custodial que presenta rampas de pesos mexicanos como anchor estándar Stellar (SEP-1, SEP-10, SEP-24, SEP-38).",
  openGraph: {
    title: "SEPuente",
    description: "Anchor SEP-24 para pesos mexicanos en Stellar",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
