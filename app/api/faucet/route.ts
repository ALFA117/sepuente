import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { StrKey } from "@stellar/stellar-sdk";
import { friendbot, horizon, sendTestXlm } from "@/lib/stellar";
import { env } from "@/lib/env";
import { dbReachable } from "@/lib/db-status";

export const dynamic = "force-dynamic";

const DAILY_LIMIT = 3; // máximo por cuenta por día

// Respaldo en memoria (por instancia) para cuando la base no responde: el límite diario
// no se pierde en silencio y un tope por hora protege la cuenta de distribución de testnet.
const HOURLY_CAP_WITHOUT_DB = 40;
const memDaily = new Map<string, number>();
let memDay = "";
let memHour = { at: 0, n: 0 };

function memUsed(account: string, today: string) {
  if (memDay !== today) { memDaily.clear(); memDay = today; }
  return memDaily.get(account) ?? 0;
}
function memRecord(account: string, today: string) {
  memUsed(account, today);
  memDaily.set(account, (memDaily.get(account) ?? 0) + 1);
  if (Date.now() - memHour.at > 3_600_000) memHour = { at: Date.now(), n: 0 };
  memHour.n++;
}

export async function POST(req: NextRequest) {
  let body: { account?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const account = body.account;
  if (!account || !StrKey.isValidEd25519PublicKey(account)) {
    return NextResponse.json({ error: "Dirección Stellar inválida." }, { status: 400 });
  }

  // Límite diario por cuenta: en la base si responde; si no, en memoria de esta instancia.
  const today = new Date().toISOString().slice(0, 10);
  const dbOk = await dbReachable();
  let used = memUsed(account, today);
  if (dbOk) {
    const { count, error } = await db
      .from("faucet_requests")
      .select("id", { count: "exact", head: true })
      .eq("stellar_account", account)
      .gte("created_at", `${today}T00:00:00Z`)
      .retry(false);
    if (error) console.error("[faucet] count", error.message);
    else used = Math.max(used, count ?? 0);
  } else {
    if (Date.now() - memHour.at > 3_600_000) memHour = { at: Date.now(), n: 0 };
    if (memHour.n >= HOURLY_CAP_WITHOUT_DB) {
      return NextResponse.json(
        { error: "El faucet de la demo alcanzó su tope por hora. Intenta más tarde." },
        { status: 429 }
      );
    }
  }

  if (used >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: `Límite de ${DAILY_LIMIT} solicitudes por día alcanzado` },
      { status: 429 }
    );
  }

  try {
    // Friendbot responde error si la cuenta ya existe; solo es fallo real si la cuenta sigue sin existir.
    const funded = await friendbot(account).then(() => true).catch(() => false);
    let topupHash: string | undefined;
    if (!funded) {
      const acc = await horizon.loadAccount(account).catch(() => null);
      if (!acc) {
        return NextResponse.json(
          { error: "Friendbot de Stellar no respondió. Intenta de nuevo en unos segundos." },
          { status: 502 }
        );
      }
      // Cuenta que ya existe con casi 0 XLM (p. ej. wallet de Pollar): recarga de testnet para reservas y comisiones.
      const xlm = parseFloat(acc.balances.find((b) => b.asset_type === "native")?.balance ?? "0");
      if (xlm < 1) topupHash = await sendTestXlm(account, "2");
    }

    memRecord(account, today);
    if (dbOk) {
      const { error } = await db.from("faucet_requests").insert({
        id: crypto.randomUUID(),
        stellar_account: account,
        created_at: new Date().toISOString(),
      });
      if (error) console.error("[faucet] insert", error.message);
    }

    return NextResponse.json({
      ok: true,
      topup_hash: topupHash,
      message: "Cuenta fondeada con XLM testnet. Agrega la trustline de TMXN desde la app.",
      asset_code: env.ASSET_CODE,
      asset_issuer: env.ISSUER_PUBLIC_KEY,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
