import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { FIAT_ASSET, stellarAsset } from "@/lib/sep24";
import { decimalsFor, priceFor } from "@/lib/sep38";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

/** GET /sep38/prices?sell_asset=&sell_amount= — precios indicativos (autenticación opcional). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const sellAsset = q.get("sell_asset");
  const sellAmount = q.get("sell_amount");
  if (!sellAsset || !sellAmount) return jsonCors({ error: "'sell_asset' and 'sell_amount' are required" }, 400);

  const buyAsset = sellAsset === FIAT_ASSET ? stellarAsset() : sellAsset === stellarAsset() ? FIAT_ASSET : null;
  if (!buyAsset) return jsonCors({ error: "Unsupported sell_asset" }, 400);

  try {
    const p = await priceFor({ sell_asset: sellAsset, buy_asset: buyAsset, sell_amount: sellAmount });
    return jsonCors({ buy_assets: [{ asset: buyAsset, price: p.total_price, decimals: decimalsFor(buyAsset) }] });
  } catch (e) {
    return jsonCors({ error: (e as Error).message }, 400);
  }
}
