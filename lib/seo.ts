import type { Metadata } from "next";

export const SITE_URL = "https://sepuente.vercel.app";

/** Metadatos por página: título, descripción, canonical y tarjetas para WhatsApp/X (la imagen OG es la del sitio). */
export function pageMeta(path: string, title: string, description: string, opts: { noindex?: boolean } = {}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: `${SITE_URL}${path}`, siteName: "SEPuente", type: "website", locale: "es_MX" },
    twitter: { card: "summary_large_image", title, description },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
