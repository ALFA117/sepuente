/**
 * API interna para la UI interactiva.
 * Acciones: quote | start_deposit | start_withdraw | simulate | status
 * Protegido con session token (no JWT SEP-10).
 */
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";
import { getDriver } from "@/lib/drivers";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { clabeError } from "@/lib/clabe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, token, ...params } = body;

  // Acciones que no requieren sesión
  if (action === "quote") {
    const driver = getDriver();
    const result = await driver.quote({
      sell_asset: params.sell_asset ?? `iso4217:MXN`,
      buy_asset: params.buy_asset ?? `stellar:${env.ASSET_CODE}:${env.ISSUER_PUBLIC_KEY}`,
      sell_amount: params.sell_amount,
      buy_amount: params.buy_amount,
    }).catch((e: Error) => ({ error: e.message }));
    return NextResponse.json(result);
  }

  // El resto requiere session token
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  let txId: string;
  try {
    ({ txId } = await verifySession(token));
  } catch {
    return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
  }

  const { data: tx } = await db
    .from("sep24_transactions")
    .select("*")
    .eq("id", txId)
    .single();
  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const driver = getDriver();

  if (action === "start_deposit") {
    const amount = params.amount ?? tx.amount_in ?? "100";
    await db.from("sep24_transactions").update({
      amount_in: amount,
      updated_at: new Date().toISOString(),
    }).eq("id", txId);

    const instructions = await driver.createDeposit({
      txId,
      stellarAccount: tx.stellar_account,
      amount,
      quoteId: params.quote_id,
      claimableBalanceSupported: params.claimable_balance_supported === "true",
    }).catch((e: Error) => ({ error: e.message }));

    return NextResponse.json(instructions);
  }

  if (action === "start_withdraw") {
    const amount = params.amount ?? tx.amount_in ?? "100";
    const clabe = params.clabe ?? "";
    const err = clabeError(clabe);
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    await db.from("sep24_transactions").update({
      amount_in: amount,
      clabe,
      updated_at: new Date().toISOString(),
    }).eq("id", txId);

    const instructions = await driver.createWithdraw({
      txId,
      stellarAccount: tx.stellar_account,
      amount,
      clabe,
      quoteId: params.quote_id,
    }).catch((e: Error) => ({ error: e.message }));

    return NextResponse.json(instructions);
  }

  if (action === "simulate") {
    if (!("simulateFiatReceived" in driver)) {
      return NextResponse.json(
        { error: "Simulación solo disponible en modo sandbox (DRIVER=mock)" },
        { status: 400 }
      );
    }
    try {
      await (driver as { simulateFiatReceived: (id: string) => Promise<void> })
        .simulateFiatReceived(txId);
    } catch (e: unknown) {
      return NextResponse.json({ error: describeError(e) }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "status") {
    const { data: fresh } = await db
      .from("sep24_transactions")
      .select("*")
      .eq("id", txId)
      .single();
    return NextResponse.json({ transaction: fresh });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

function describeError(e: unknown): string {
  const codes = (e as { response?: { data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } } })
    ?.response?.data?.extras?.result_codes;
  const ops = codes?.operations ?? [];
  if (ops.includes("op_no_trust")) return "Tu wallet no tiene trustline de TMXN. Agrégala en el paso 2 de la demo.";
  if (ops.includes("op_underfunded")) return "La cuenta de distribución del anchor no tiene saldo TMXN suficiente.";
  if (ops.includes("op_no_destination")) return "Tu wallet no existe en testnet. Fondéala con el faucet primero.";
  if (codes) return `Stellar rechazó la transacción: ${[codes.transaction, ...ops].filter(Boolean).join(", ")}`;
  return (e as Error)?.message ?? "Error desconocido al simular el depósito";
}
