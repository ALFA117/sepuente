import { jsonCors, optionsResponse } from "@/lib/cors";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

export async function GET() {
  return jsonCors({
    deposit: {
      [env.ASSET_CODE]: {
        enabled: true,
        authentication_required: true,
        min_amount: "10",
        max_amount: "50000",
        fee_fixed: "0",
        fee_percent: "0.5",
      },
    },
    withdraw: {
      [env.ASSET_CODE]: {
        enabled: true,
        authentication_required: true,
        min_amount: "10",
        max_amount: "50000",
        fee_fixed: "0",
        fee_percent: "0.5",
        types: {
          bank_account: {
            fields: {
              dest: {
                description: "CLABE interbancaria de 18 dígitos",
                optional: false,
              },
            },
          },
        },
      },
    },
    fee: { enabled: false },
    features: {
      account_creation: false,
      claimable_balances: true,
    },
  });
}
