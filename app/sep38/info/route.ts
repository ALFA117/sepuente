import { jsonCors, optionsResponse } from "@/lib/cors";
import { FIAT_ASSET, stellarAsset } from "@/lib/sep24";
import { SPEI_METHOD } from "@/lib/sep38";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

export async function GET() {
  return jsonCors({
    assets: [
      { asset: stellarAsset() },
      {
        asset: FIAT_ASSET,
        country_codes: ["MEX"],
        sell_delivery_methods: [SPEI_METHOD],
        buy_delivery_methods: [SPEI_METHOD],
      },
    ],
  });
}
