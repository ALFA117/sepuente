import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { StrKey } from "@stellar/stellar-sdk";
import { friendbot, horizon } from "@/lib/stellar";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 3; // máximo por cuenta por día

export async function POST(req: NextRequest) {
  let body: { account?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const account = body.account;
  if (!account || !StrKey.isValidEd25519PublicKey(account)) {
    return NextResponse.json({ error: "Dirección Stellar inválida." }, { status: 400 });
  }

  // Límite diario por cuenta
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await db
    .from("faucet_requests")
    .select("id", { count: "exact", head: true })
    .eq("stellar_account", account)
    .gte("created_at", `${today}T00:00:00Z`);

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: `Límite de ${DAILY_LIMIT} solicitudes por día alcanzado` },
      { status: 429 }
    );
  }

  try {
    // Friendbot responde error si la cuenta ya existe; solo es fallo real si la cuenta sigue sin existir.
    const funded = await friendbot(account).then(() => true).catch(() => false);
    if (!funded) {
      const exists = await horizon.loadAccount(account).then(() => true).catch(() => false);
      if (!exists) {
        return NextResponse.json(
          { error: "Friendbot de Stellar no respondió. Intenta de nuevo en unos segundos." },
          { status: 502 }
        );
      }
    }

    await db.from("faucet_requests").insert({
      id: crypto.randomUUID(),
      stellar_account: account,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: "Cuenta fondeada con XLM testnet. Agrega la trustline de TMXN desde la app.",
      asset_code: env.ASSET_CODE,
      asset_issuer: env.ISSUER_PUBLIC_KEY,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
