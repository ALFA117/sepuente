import { NextRequest } from "next/server";
import { MuxedAccount, StrKey } from "@stellar/stellar-sdk";
import { jsonCors } from "./cors";
import { requireSep10 } from "./auth-middleware";
import { db } from "./supabase";
import { signSession } from "./jwt";
import { env } from "./env";
import { amountError } from "./amount";
import { isSupportedAsset } from "./sep24";

async function readBody(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      const data = await req.json();
      return data && typeof data === "object" ? data : {};
    }
    const fd = await req.formData();
    const out: Record<string, string> = {};
    fd.forEach((v, k) => { out[k] = String(v); });
    return out;
  } catch {
    return {};
  }
}

/** Cuenta G... subyacente de una dirección G o M (muxed); null si no es válida. */
function baseAccount(address: string): string | null {
  if (StrKey.isValidEd25519PublicKey(address)) return address;
  if (StrKey.isValidMed25519PublicKey(address)) {
    try { return MuxedAccount.fromAddress(address, "0").baseAccount().accountId(); } catch { return null; }
  }
  return null;
}

/** POST /sep24/transactions/{deposit,withdraw}/interactive */
export async function startInteractive(req: NextRequest, kind: "deposit" | "withdrawal") {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const body = await readBody(req);

  const assetCode = body.asset_code;
  if (!assetCode) return jsonCors({ error: "Missing 'asset_code'" }, 400);
  if (!isSupportedAsset(assetCode)) return jsonCors({ error: `Unsupported asset_code: ${assetCode}` }, 400);

  if (body.account) {
    const base = baseAccount(body.account);
    if (!base) return jsonCors({ error: "Invalid 'account': must be a valid G... or M... address" }, 400);
    if (base !== claims.account) return jsonCors({ error: "'account' must match the SEP-10 authenticated account" }, 403);
  }

  if (body.amount && amountError(body.amount)) {
    return jsonCors({ error: `Invalid 'amount': ${amountError(body.amount)}` }, 400);
  }
  const amount = body.amount ?? "";

  const txId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error } = await db.from("sep24_transactions").insert({
    id: txId,
    kind,
    status: "incomplete",
    stellar_account: claims.account,
    asset_code: assetCode,
    asset_issuer: env.ISSUER_PUBLIC_KEY,
    amount_in: amount || null,
    started_at: now,
    updated_at: now,
  });
  if (error) {
    console.error(`[sep24/${kind}] insert`, error);
    return jsonCors({ error: "No se pudo crear la transacción. Intenta de nuevo en unos segundos." }, 500);
  }

  const sessionToken = await signSession(txId);
  const url = `${env.APP_URL}/sep24/interactive?token=${encodeURIComponent(sessionToken)}&kind=${kind === "deposit" ? "deposit" : "withdraw"}&amount=${encodeURIComponent(amount)}`;

  return jsonCors({ type: "interactive_customer_info_needed", url, id: txId });
}
