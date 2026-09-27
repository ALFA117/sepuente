import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { formatSep24Tx, isSupportedAsset } from "@/lib/sep24";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /sep24/transactions — historial de la cuenta autenticada (SEP-24). */
export async function GET(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const q = req.nextUrl.searchParams;
  // asset_code es obligatorio en SEP-24; si falta se asume el único activo del anchor.
  const assetCode = q.get("asset_code") ?? env.ASSET_CODE;
  if (!isSupportedAsset(assetCode)) return jsonCors({ error: `Unsupported asset_code: ${assetCode}` }, 400);

  const kind = q.get("kind");
  if (kind && kind !== "deposit" && kind !== "withdrawal") {
    return jsonCors({ error: "Invalid 'kind': use deposit or withdrawal" }, 400);
  }

  const noOlderThan = q.get("no_older_than");
  if (noOlderThan && Number.isNaN(Date.parse(noOlderThan))) {
    return jsonCors({ error: "Invalid 'no_older_than': must be an ISO 8601 date" }, 400);
  }

  const limitRaw = q.get("limit");
  const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
  if (!Number.isFinite(limit) || limit < 1) return jsonCors({ error: "Invalid 'limit'" }, 400);

  let query = db
    .from("sep24_transactions")
    .select("*")
    .eq("stellar_account", claims.account)
    .eq("asset_code", assetCode)
    .order("started_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (kind) query = query.eq("kind", kind);
  if (noOlderThan) query = query.gte("started_at", new Date(noOlderThan).toISOString());

  // paging_id: devuelve las transacciones anteriores a la indicada.
  const pagingId = q.get("paging_id");
  if (pagingId) {
    if (!UUID.test(pagingId)) return jsonCors({ error: "Invalid 'paging_id'" }, 400);
    const { data: anchorRow } = await db.from("sep24_transactions").select("started_at").eq("id", pagingId).maybeSingle();
    if (anchorRow) query = query.lt("started_at", anchorRow.started_at);
  }

  const { data, error } = await query;
  if (error) return jsonCors({ error: "Could not read transactions" }, 500);

  return jsonCors({ transactions: (data ?? []).map(formatSep24Tx) });
}
