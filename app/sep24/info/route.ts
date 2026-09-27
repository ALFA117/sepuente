import { jsonCors, optionsResponse } from "@/lib/cors";
import { env } from "@/lib/env";
import { MIN_AMOUNT, MAX_AMOUNT } from "@/lib/amount";
import { FEE_PERCENT } from "@/lib/sep24";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

// SEP-24 /info: montos y comisiones como números; la autenticación SEP-10 es siempre obligatoria.
export async function GET() {
  const asset = {
    enabled: true,
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
