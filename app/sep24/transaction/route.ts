import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { getDriver } from "@/lib/drivers";
import { formatSep24Tx } from "@/lib/sep24";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PENDING = ["pending_anchor", "pending_user_transfer_start", "pending_stellar"];

/** GET /sep24/transaction?id=|stellar_transaction_id=|external_transaction_id= */
export async function GET(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const q = req.nextUrl.searchParams;
  const id = q.get("id");
  const stellarTxId = q.get("stellar_transaction_id");
  const externalId = q.get("external_transaction_id");
  if (!id && !stellarTxId && !externalId) {
    return jsonCors({ error: "One of 'id', 'stellar_transaction_id' or 'external_transaction_id' is required" }, 400);
  }
  if (id && !UUID.test(id)) return jsonCors({ error: "Transaction not found" }, 404);

  let query = db.from("sep24_transactions").select("*").eq("stellar_account", claims.account);
  if (id) query = query.eq("id", id);
  else if (stellarTxId) query = query.eq("stellar_transaction_id", stellarTxId);
  else query = query.eq("spei_reference", externalId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) return jsonCors({ error: "Could not read the transaction" }, 500);
  if (!data) return jsonCors({ error: "Transaction not found" }, 404);
  let row = data;

  // Pull-on-read: el driver actualiza el estado (p. ej. detecta el pago de un retiro en Horizon).
  if (PENDING.includes(data.status)) {
    const fresh = await getDriver().getStatus(data.id).catch(() => null);
    if (fresh) {
      await db.from("sep24_transactions").update({
        status: fresh.status,
        stellar_transaction_id: fresh.stellar_transaction_id ?? data.stellar_transaction_id,
        updated_at: new Date().toISOString(),
      }).eq("id", data.id);
      const { data: reread } = await db.from("sep24_transactions").select("*").eq("id", data.id).single();
      row = reread ?? { ...data, status: fresh.status };
    }
  }

  return jsonCors({ transaction: formatSep24Tx(row) });
}
