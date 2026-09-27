import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEPuente · pesos mexicanos en Stellar",
    short_name: "SEPuente",
    description: "Anchor SEP-24 abierto y sin custodia para pesos mexicanos en Stellar.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1A33",
    theme_color: "#0A1A33",
    lang: "es-MX",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
