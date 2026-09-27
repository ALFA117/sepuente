import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/devs",
  "Documentación · SEPuente",
  "Endpoints SEP-1, SEP-10, SEP-24 y SEP-38 del anchor, cómo integrar tu wallet y cómo correr la suite oficial anchor-tests de SDF.",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
