import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/demo",
  "Demo · SEPuente",
  "Prueba el anchor en testnet: entra con tu correo o con una llave en el navegador, deposita pesos simulados por SPEI y retíralos a una CLABE de prueba.",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
