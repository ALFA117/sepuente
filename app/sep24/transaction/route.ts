import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { getDriver } from "@/lib/drivers";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

export async function GET(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const txId = req.nextUrl.searchParams.get("id");
  if (!txId) return jsonCors({ error: "Missing id" }, 400);

  const { data, error } = await db
    .from("sep24_transactions")
    .select("*")
    .eq("id", txId)
    .eq("stellar_account", claims.sub)
    .single();

  if (error || !data) return jsonCors({ error: "Transaction not found" }, 404);

  // Pull-on-read: actualiza estado desde el driver
  const driver = getDriver();
  if (
    data.status === "pending_anchor" ||
    data.status === "pending_user_transfer_start" ||
    data.status === "pending_stellar"
  ) {
    const fresh = await driver.getStatus(txId).catch(() => null);
    if (fresh) {
      await db.from("sep24_transactions").update({
        status: fresh.status,
        stellar_transaction_id: fresh.stellar_transaction_id ?? data.stellar_transaction_id,
        updated_at: new Date().toISOString(),
      }).eq("id", txId);
      data.status = fresh.status;
      data.stellar_transaction_id = fresh.stellar_transaction_id ?? data.stellar_transaction_id;
    }
  }

  return jsonCors({ transaction: formatTx(data) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTx(data: any) {
  const explorerBase =
    env.STELLAR_NETWORK === "TESTNET"
      ? "https://stellar.expert/explorer/testnet/tx"
      : "https://stellar.expert/explorer/public/tx";

  return {
    id: data.id,
    kind: data.kind,
    status: data.status,
    status_eta: null,
    amount_in: data.amount_in ?? null,
    amount_in_asset: data.amount_in
      ? `iso4217:MXN`
      : null,
    amount_out: data.amount_out ?? null,
    amount_out_asset: data.amount_out
      ? `stellar:${data.asset_code}:${data.asset_issuer}`
      : null,
    amount_fee: data.amount_fee ?? null,
    started_at: data.started_at,
    completed_at: data.completed_at ?? null,
    updated_at: data.updated_at,
    more_info_url: `${env.APP_URL}/sep24/interactive?id=${data.id}`,
    stellar_transaction_id: data.stellar_transaction_id ?? null,
    stellar_memo: data.anchor_memo ?? null,
    stellar_memo_type: data.anchor_memo_type ?? null,
    to: data.kind === "deposit" ? data.stellar_account : null,
    from: data.kind === "withdrawal" ? data.stellar_account : null,
    deposit_memo: data.kind === "deposit" ? data.spei_reference : null,
    deposit_memo_type: data.kind === "deposit" ? "text" : null,
    claimable_balance_id: data.claimable_balance_id ?? null,
    message:
      data.error_message ??
      (data.status === "pending_user_transfer_start" && data.kind === "deposit"
        ? `Transfiere vía SPEI a CLABE ${data.clabe} con referencia ${data.spei_reference}`
        : null),
    external_transaction_id: data.spei_reference ?? null,
    stellar_transaction_url: data.stellar_transaction_id
      ? `${explorerBase}/${data.stellar_transaction_id}`
      : null,
  };
}
