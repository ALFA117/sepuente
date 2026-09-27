import { pageMeta } from "@/lib/seo";

// Pantalla de una operación concreta (llega con token): no se indexa.
export const metadata = pageMeta(
  "/sep24/interactive",
  "Operación SEP-24 · SEPuente",
  "Pantalla interactiva del anchor para depositar o retirar pesos.",
  { noindex: true },
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
