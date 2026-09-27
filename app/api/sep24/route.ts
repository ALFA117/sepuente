/**
 * API interna para la UI interactiva.
 * Acciones: quote | start_deposit | start_withdraw | edit_amount | simulate | status
 * Protegido con session token (no JWT SEP-10).
 */
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";
import { getDriver } from "@/lib/drivers";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { clabeError } from "@/lib/clabe";
import { amountError } from "@/lib/amount";
import { describeError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const PENDING = ["pending_user_transfer_start", "pending_anchor", "pending_stellar"];

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  try {
    return await handle(body);
  } catch (e: unknown) {
    console.error("[api/sep24]", body.action, e);
    return NextResponse.json({ error: describeError(e) }, { status: 500 });
  }
}

async function handle(body: Record<string, string>) {
  const { action, token, ...params } = body;
  const sandbox = env.DRIVER === "mock";

  if (action === "quote") {
    const aErr = amountError(params.sell_amount ?? params.buy_amount);
    if (aErr) return NextResponse.json({ error: aErr }, { status: 400 });
    const result = await getDriver().quote({
      sell_asset: params.sell_asset ?? `iso4217:MXN`,
      buy_asset: params.buy_asset ?? `stellar:${env.ASSET_CODE}:${env.ISSUER_PUBLIC_KEY}`,
      sell_amount: params.sell_amount,
      buy_amount: params.buy_amount,
    });
    return NextResponse.json({ ...result, sandbox });
  }

  if (!token) {
    return NextResponse.json({ error: "Falta el token de sesión. Abre esta pantalla desde tu wallet." }, { status: 401 });
  }
  let txId: string;
  try {
    ({ txId } = await verifySession(token));
  } catch {
    return NextResponse.json({ error: "La sesión expiró. Vuelve a tu wallet e inicia la operación de nuevo." }, { status: 401 });
  }

  const { data: tx } = await db.from("sep24_transactions").select("*").eq("id", txId).single();
  if (!tx) {
    return NextResponse.json({ error: "No encontramos esta transacción." }, { status: 404 });
  }

  const driver = getDriver();

  if (action === "start_deposit" || action === "start_withdraw") {
    const isDeposit = action === "start_deposit";
    if ((isDeposit ? "deposit" : "withdrawal") !== tx.kind) {
      return NextResponse.json({ error: "Tipo de operación no coincide con la transacción." }, { status: 400 });
    }
    // Idempotencia: si ya se iniciaron instrucciones, se devuelven las mismas sin tocar el driver.
    if (tx.status !== "incomplete") {
      if (tx.status === "pending_user_transfer_start") {
        return NextResponse.json(
          isDeposit
            ? { clabe: tx.clabe, reference: tx.spei_reference, bank_name: sandbox ? "Banco de Prueba SEPuente" : "SPEI", beneficiary: sandbox ? "SEPuente Escrow Demo" : "SEPuente", sandbox }
            : { anchor_account: tx.anchor_account, anchor_memo: tx.anchor_memo, anchor_memo_type: tx.anchor_memo_type, sandbox }
        );
      }
      return NextResponse.json({ error: "Esta operación ya fue procesada." }, { status: 409 });
    }

    const amount = params.amount ?? "";
    const aErr = amountError(amount);
    if (aErr) return NextResponse.json({ error: aErr }, { status: 400 });

    if (isDeposit) {
      await db.from("sep24_transactions").update({ amount_in: amount, updated_at: new Date().toISOString() }).eq("id", txId);
      const instructions = await driver.createDeposit({
        txId,
        stellarAccount: tx.stellar_account,
        amount,
        quoteId: params.quote_id,
        claimableBalanceSupported: params.claimable_balance_supported === "true",
      });
      return NextResponse.json({ ...instructions, sandbox });
    }

    const clabe = (params.clabe ?? "").trim();
    const cErr = clabeError(clabe);
    if (cErr) return NextResponse.json({ error: cErr }, { status: 400 });
    await db.from("sep24_transactions").update({ amount_in: amount, clabe, updated_at: new Date().toISOString() }).eq("id", txId);
    const instructions = await driver.createWithdraw({
      txId,
      stellarAccount: tx.stellar_account,
      amount,
      clabe,
      quoteId: params.quote_id,
    });
    return NextResponse.json({ ...instructions, sandbox });
  }

  if (action === "edit_amount") {
    // Volver al paso "Monto" antes de pagar. Solo en sandbox: con un proveedor real
    // la orden ya creada del otro lado quedaría abierta.
    if (!sandbox) {
      return NextResponse.json({ error: "Para cambiar el monto, cancela y empieza una operación nueva." }, { status: 409 });
    }
    if (tx.status !== "pending_user_transfer_start" || tx.stellar_transaction_id) {
      return NextResponse.json({ error: "El pago ya se detectó; ya no se puede cambiar el monto." }, { status: 409 });
    }
    await db
      .from("sep24_transactions")
      .update({ status: "incomplete", amount_in: null, updated_at: new Date().toISOString() })
      .eq("id", txId);
    return NextResponse.json({ ok: true });
  }

  if (action === "simulate") {
    if (!driver.simulateFiatReceived) {
      return NextResponse.json({ error: "La simulación solo existe en modo sandbox." }, { status: 400 });
    }
    try {
      await driver.simulateFiatReceived(txId);
    } catch (e: unknown) {
      return NextResponse.json({ error: describeError(e) }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "status") {
    if (PENDING.includes(tx.status)) {
      await driver.getStatus(txId).catch((e) => console.error("[api/sep24] getStatus", e));
    }
    const { data: fresh } = await db.from("sep24_transactions").select("*").eq("id", txId).single();
    return NextResponse.json({ transaction: fresh, sandbox });
  }

  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
