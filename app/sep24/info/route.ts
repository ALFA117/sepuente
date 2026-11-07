import { jsonCors, optionsResponse } from "@/lib/cors";
import { env } from "@/lib/env";
import { MIN_AMOUNT, MAX_AMOUNT } from "@/lib/amount";
import { FEE_PERCENT } from "@/lib/sep24";
import { dbReachable } from "@/lib/db-status";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

// SEP-24 /info: montos y comisiones como números; la autenticación SEP-10 es siempre obligatoria.
// Si la base del anchor no responde, depósitos y retiros se anuncian deshabilitados: las wallets
// (p. ej. la Demo Wallet de SDF) lo muestran en vez de toparse con un 503 a medio flujo.
export async function GET() {
  const enabled = await dbReachable();
  const asset = {
    enabled,
    min_amount: MIN_AMOUNT,
    max_amount: MAX_AMOUNT,
    fee_fixed: 0,
    fee_percent: FEE_PERCENT,
  };
  return jsonCors({
    deposit: { [env.ASSET_CODE]: asset },
    withdraw: { [env.ASSET_CODE]: asset },
    fee: { enabled: false },
    features: { account_creation: false, claimable_balances: false },
  });
}
