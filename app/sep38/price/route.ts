import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { getDriver } from "@/lib/drivers";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

export async function GET(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);

  const sellAsset = req.nextUrl.searchParams.get("sell_asset");
  const buyAsset = req.nextUrl.searchParams.get("buy_asset");
  const sellAmount = req.nextUrl.searchParams.get("sell_amount");
  const buyAmount = req.nextUrl.searchParams.get("buy_amount");

  if (!sellAsset || !buyAsset) {
    return jsonCors({ error: "sell_asset and buy_asset required" }, 400);
  }

  const driver = getDriver();
  const q = await driver.quote({ sell_asset: sellAsset, buy_asset: buyAsset, sell_amount: sellAmount ?? undefined, buy_amount: buyAmount ?? undefined })
    .catch((e: Error) => ({ error: e.message }));

  if ("error" in q) return jsonCors({ error: q.error }, 400);

  return jsonCors({
    total_price: q.price,
    price: q.price,
    sell_amount: q.sell_amount,
    buy_amount: q.buy_amount,
    fee: {
      total: q.fee,
      asset: sellAsset,
    },
  });
}
