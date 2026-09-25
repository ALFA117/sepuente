import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { getDriver } from "@/lib/drivers";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

export async function GET(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);

  const sellAsset = req.nextUrl.searchParams.get("sell_asset") ?? "iso4217:MXN";
  const sellAmount = req.nextUrl.searchParams.get("sell_amount") ?? "100";

  const driver = getDriver();
  const buyAsset = `stellar:${env.ASSET_CODE}:${env.ISSUER_PUBLIC_KEY}`;
  const q = await driver.quote({ sell_asset: sellAsset, buy_asset: buyAsset, sell_amount: sellAmount })
    .catch((e: Error) => ({ error: e.message }));

  if ("error" in q) return jsonCors({ error: q.error }, 400);

  return jsonCors({
    buy_assets: [
      {
        asset: buyAsset,
        price: q.price,
        decimals: 7,
      },
    ],
  });
}
