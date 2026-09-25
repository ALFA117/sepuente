import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

export async function GET(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "20"),
    100
  );
  const kind = req.nextUrl.searchParams.get("kind"); // deposit | withdrawal
  const paging = req.nextUrl.searchParams.get("paging_id");

  let query = db
    .from("sep24_transactions")
    .select("*")
    .eq("stellar_account", claims.sub)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (kind) query = query.eq("kind", kind);
  if (paging) query = query.lt("started_at", paging);

  const { data, error } = await query;
  if (error) return jsonCors({ error: error.message }, 500);

  return jsonCors({
    transactions: (data ?? []).map((tx) => ({
      id: tx.id,
      kind: tx.kind,
      status: tx.status,
      amount_in: tx.amount_in ?? null,
      amount_out: tx.amount_out ?? null,
      amount_fee: tx.amount_fee ?? null,
      started_at: tx.started_at,
      completed_at: tx.completed_at ?? null,
      updated_at: tx.updated_at,
      stellar_transaction_id: tx.stellar_transaction_id ?? null,
    })),
  });
}
