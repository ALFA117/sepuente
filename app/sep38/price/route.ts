import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { priceFor, QUOTE_CONTEXTS } from "@/lib/sep38";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

/** GET /sep38/price — precio indicativo para un monto (autenticación opcional). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const sellAsset = q.get("sell_asset");
  const buyAsset = q.get("buy_asset");
  const context = q.get("context");
  if (!sellAsset || !buyAsset) return jsonCors({ error: "'sell_asset' and 'buy_asset' are required" }, 400);
  if (context && !QUOTE_CONTEXTS.includes(context as (typeof QUOTE_CONTEXTS)[number])) {
    return jsonCors({ error: `Unsupported context. Use one of: ${QUOTE_CONTEXTS.join(", ")}` }, 400);
  }

  try {
    const p = await priceFor({ sell_asset: sellAsset, buy_asset: buyAsset, sell_amount: q.get("sell_amount"), buy_amount: q.get("buy_amount") });
    return jsonCors({
      total_price: p.total_price,
      price: p.price,
      sell_amount: p.sell_amount,
      buy_amount: p.buy_amount,
      fee: p.fee,
    });
  } catch (e) {
    return jsonCors({ error: (e as Error).message }, 400);
  }
}
