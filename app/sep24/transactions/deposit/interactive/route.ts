import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { signSession } from "@/lib/jwt";
import { env } from "@/lib/env";
import { amountError } from "@/lib/amount";

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
  if (assetCode !== env.ASSET_CODE) return jsonCors({ error: `Activo no soportado: ${assetCode}` }, 400);
  const amount = body.amount && !amountError(body.amount) ? body.amount : "";

  const txId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await db.from("sep24_transactions").insert({
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
  if (error) {
    console.error("[sep24/deposit] insert", error);
    return jsonCors({ error: "No se pudo crear la transacción. Intenta de nuevo en unos segundos." }, 500);
  }

  const sessionToken = await signSession(txId);
  const interactiveUrl = `${env.APP_URL}/sep24/interactive?token=${encodeURIComponent(sessionToken)}&kind=deposit&amount=${encodeURIComponent(amount)}`;

  return jsonCors({
    type: "interactive_customer_info_needed",
    url: interactiveUrl,
    id: txId,
  });
}
