import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ScrollReveal } from "./components/ScrollReveal";

const inter = Inter({ subsets: ["latin"], variable: "--nf-inter", weight: ["400", "500", "600", "700"], display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--nf-serif", weight: ["500", "600", "700"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--nf-mono", weight: ["400", "500", "700"], display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A1A33",
  colorScheme: "dark",
};

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
    <html lang="es" className={`${inter.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <ScrollReveal />
        {children}
      </body>
    </html>
  );
}
