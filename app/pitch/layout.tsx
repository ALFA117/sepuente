import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/pitch",
  "Pitch · SEPuente",
  "Por qué México necesita un anchor abierto y sin custodia para el peso en Stellar: problema, solución, validación y roadmap.",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
