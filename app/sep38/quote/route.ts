import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { formatQuote, priceFor, QUOTE_CONTEXTS } from "@/lib/sep38";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

/** POST /sep38/quote — cotización firme con vencimiento, ligada a la cuenta SEP-10. */
export async function POST(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return jsonCors({ error: "Invalid JSON body" }, 400); }

  const { sell_asset, buy_asset, sell_amount, buy_amount, context } = body;
  if (!sell_asset || !buy_asset) return jsonCors({ error: "'sell_asset' and 'buy_asset' are required" }, 400);
  if (!context || !QUOTE_CONTEXTS.includes(context as (typeof QUOTE_CONTEXTS)[number])) {
    return jsonCors({ error: `'context' is required: ${QUOTE_CONTEXTS.join(", ")}` }, 400);
  }

  let p;
  try {
    p = await priceFor({ sell_asset, buy_asset, sell_amount, buy_amount });
  } catch (e) {
    return jsonCors({ error: (e as Error).message }, 400);
  }

  const row = {
    id: crypto.randomUUID(),
    sell_asset,
    buy_asset,
    sell_amount: p.sell_amount,
    buy_amount: p.buy_amount,
    price: p.price,
    fee: p.fee.total,
    expires_at: p.expires_at,
    created_at: new Date().toISOString(),
    stellar_account: claims.account,
    context,
  };
  const { error } = await db.from("sep38_quotes").insert(row);
  if (error) {
    console.error("[sep38/quote] insert", error);
    return jsonCors({ error: "Could not store the quote" }, 500);
  }

  return jsonCors(formatQuote(row), 201);
}
