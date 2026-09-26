import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ScrollReveal } from "./components/ScrollReveal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://sepuente.vercel.app"),
  title: "SEPuente – Anchor SEP-24 para pesos mexicanos",
  description:
    "Gateway open source y no custodial que implementa el stack SEP completo (SEP-1, SEP-10, SEP-24, SEP-38) para rampas de pesos mexicanos en Stellar.",
  keywords: ["stellar", "anchor", "SEP-24", "SPEI", "pesos mexicanos", "TMXN", "DeFi", "blockchain", "Mexico"],
  authors: [{ name: "SEPuente" }],
  openGraph: {
    title: "SEPuente – Anchor SEP-24 para pesos mexicanos en Stellar",
    description:
      "Gateway open source y no custodial para pesos mexicanos en Stellar. SEP-1, SEP-10, SEP-24, SEP-38 implementados. Sin custodia.",
    type: "website",
    url: "https://sepuente.vercel.app",
    siteName: "SEPuente",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEPuente – Anchor SEP-24 para pesos mexicanos",
    description:
      "Gateway open source y no custodial para rampas MXN en Stellar. SEP-1 · SEP-10 · SEP-24 · SEP-38.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable} ${mono.variable}`}>
      <body>
        <ScrollReveal />
        {children}
      </body>
    </html>
  );
}
