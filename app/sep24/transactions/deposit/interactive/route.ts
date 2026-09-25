import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { signSession } from "@/lib/jwt";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function OPTIONS() { return optionsResponse(); }

export async function POST(req: NextRequest) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  let body: Record<string, string> = {};
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    body = await req.json().catch(() => ({}));
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd) fd.forEach((v, k) => { body[k] = String(v); });
  }

  const assetCode = body.asset_code ?? env.ASSET_CODE;
  const amount = body.amount ?? "";
  const claimableBalanceSupported = body.claimable_balance_supported === "true";

  const txId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.from("sep24_transactions").insert({
    id: txId,
    kind: "deposit",
    status: "incomplete",
    stellar_account: claims.sub,
    asset_code: assetCode,
    asset_issuer: env.ISSUER_PUBLIC_KEY,
    amount_in: amount || null,
    started_at: now,
    updated_at: now,
  });

  const sessionToken = await signSession(txId);
  const interactiveUrl = `${env.APP_URL}/sep24/interactive?token=${sessionToken}&kind=deposit&amount=${amount}`;

  return jsonCors({
    type: "interactive_customer_info_needed",
    url: interactiveUrl,
    id: txId,
  });
}
