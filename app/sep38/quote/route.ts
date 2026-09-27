import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { getDriver } from "@/lib/drivers";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

export async function POST(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { /**/ }

  const { sell_asset, buy_asset, sell_amount, buy_amount, context } = body;
  if (!sell_asset || !buy_asset) {
    return jsonCors({ error: "sell_asset and buy_asset required" }, 400);
  }
  if (!sell_amount && !buy_amount) {
    return jsonCors({ error: "sell_amount or buy_amount required" }, 400);
  }

  const driver = getDriver();
  const q = await driver.quote({ sell_asset, buy_asset, sell_amount, buy_amount })
    .catch((e: Error) => ({ error: e.message }));
  if ("error" in q) return jsonCors({ error: q.error }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.from("sep38_quotes").insert({
    id,
    sell_asset,
    buy_asset,
    sell_amount: q.sell_amount,
    buy_amount: q.buy_amount,
    price: q.price,
    fee: q.fee,
    expires_at: q.expires_at,
    created_at: now,
    stellar_account: claims.account,
    context: context ?? "sep24",
  });

  return jsonCors({
    id,
    sell_asset,
    buy_asset,
    sell_amount: q.sell_amount,
    buy_amount: q.buy_amount,
    price: q.price,
    total_price: q.price,
    fee: { total: q.fee, asset: sell_asset },
    expires_at: q.expires_at,
    created_at: now,
  });
}
