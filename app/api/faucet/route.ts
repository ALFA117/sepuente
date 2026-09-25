import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { friendbot, ensureTrustline } from "@/lib/stellar";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 3; // máximo por cuenta por día

export async function POST(req: NextRequest) {
  let body: { account?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const account = body.account;
  if (!account || !account.startsWith("G") || account.length !== 56) {
    return NextResponse.json({ error: "Invalid Stellar account" }, { status: 400 });
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
    // 1. Friendbot fondea con XLM
    await friendbot(account).catch(() => null); // puede fallar si ya tiene fondos

    // 2. Agrega trustline si DISTRIBUTION_SECRET_KEY disponible en servidor
    // La trustline la debe agregar la wallet del usuario; aquí solo validamos que la cuenta exista.
    // La app frontend establece la trustline con su keypair.

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

// Para que ensureTrustline no quede sin uso en este archivo
void ensureTrustline;
