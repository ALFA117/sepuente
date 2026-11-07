import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/demo",
  "Demo · SEPuente",
  "Wallet de prueba en Stellar testnet: entra con tu correo o con una llave en el navegador y conéctate al anchor con SEP-10. Con la base de datos activa, deposita pesos simulados por SPEI y retíralos a una CLABE de prueba.",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
