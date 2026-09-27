import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const { id } = await params;
  const { data, error } = await db
    .from("sep38_quotes")
    .select("*")
    .eq("id", id)
    .eq("stellar_account", claims.account)
    .single();

  if (error || !data) return jsonCors({ error: "Quote not found" }, 404);
  if (new Date(data.expires_at) < new Date()) {
    return jsonCors({ error: "Quote expired" }, 400);
  }

  return jsonCors({
    id: data.id,
    sell_asset: data.sell_asset,
    buy_asset: data.buy_asset,
    sell_amount: data.sell_amount,
    buy_amount: data.buy_amount,
    price: data.price,
    total_price: data.price,
    fee: { total: data.fee, asset: data.sell_asset },
    expires_at: data.expires_at,
    created_at: data.created_at,
  });
}
