import { db } from "../supabase";
import { sendTmxn } from "../stellar";
import { env } from "../env";
import type {
  RampDriver,
  QuoteResult,
  DepositInstructions,
  WithdrawInstructions,
  DriverStatus,
} from "./types";

// 1 TMXN = 1 MXN simulado, comisión 0.5 %
const FEE_RATE = 0.005;
const MOCK_BANK = "Banco de Prueba SEPuente";
const MOCK_BENEFICIARY = "SEPuente Escrow Demo";
const QUOTE_TTL_SECONDS = 900;

export class MockDriver implements RampDriver {
  async quote(params: {
    sell_asset: string;
    buy_asset: string;
    sell_amount?: string;
    buy_amount?: string;
  }): Promise<QuoteResult> {
    const sellAmt = parseFloat(params.sell_amount ?? params.buy_amount ?? "");
    if (!Number.isFinite(sellAmt) || sellAmt <= 0) throw new Error("Monto inválido para cotizar.");
    const fee = parseFloat((sellAmt * FEE_RATE).toFixed(7));
    const buyAmt = parseFloat((sellAmt - fee).toFixed(7));
    const expires_at = new Date(
      Date.now() + QUOTE_TTL_SECONDS * 1000
    ).toISOString();
    return {
      sell_amount: sellAmt.toFixed(2),
      buy_amount: buyAmt.toFixed(7),
      price: "1.0000000",
      fee: fee.toFixed(7),
      expires_at,
    };
  }

  async createDeposit(params: {
    txId: string;
    stellarAccount: string;
    amount: string;
    quoteId?: string;
    claimableBalanceSupported?: boolean;
  }): Promise<DepositInstructions> {
    const reference = `SP${params.txId.slice(0, 8).toUpperCase()}`;
    // CLABE ficticia solo para demo/testnet — en producción Etherfuse devuelve la real
    const clabe = "646180157000000004";

    await db.from("sep24_transactions").update({
      status: "pending_user_transfer_start",
      clabe,
      spei_reference: reference,
      updated_at: new Date().toISOString(),
    }).eq("id", params.txId);

    return { clabe, reference, bank_name: MOCK_BANK, beneficiary: MOCK_BENEFICIARY };
  }

  async createWithdraw(params: {
    txId: string;
    stellarAccount: string;
    amount: string;
    clabe: string;
    quoteId?: string;
  }): Promise<WithdrawInstructions> {
    const memo = params.txId.slice(0, 16).toUpperCase();

    await db.from("sep24_transactions").update({
      status: "pending_user_transfer_start",
      anchor_account: env.DISTRIBUTION_PUBLIC_KEY,
      anchor_memo: memo,
      anchor_memo_type: "text",
      updated_at: new Date().toISOString(),
    }).eq("id", params.txId);

    return {
      anchor_account: env.DISTRIBUTION_PUBLIC_KEY,
      anchor_memo: memo,
      anchor_memo_type: "text",
    };
  }

  async getStatus(txId: string): Promise<DriverStatus> {
    const { data } = await db
      .from("sep24_transactions")
      .select("*")
      .eq("id", txId)
      .single();

    if (!data) return { status: "error", error_message: "Transaction not found" };

    // Para retiros: detecta pago entrante en Horizon
    if (data.kind === "withdrawal" && data.status === "pending_user_transfer_start") {
      const { findIncomingPayment } = await import("../stellar");
      const payment = await findIncomingPayment(
        env.DISTRIBUTION_PUBLIC_KEY,
        data.stellar_account,
        data.anchor_memo ?? "",
        env.ASSET_CODE
      ).catch(() => null);

      if (payment && parseFloat(payment.amount) + 1e-7 >= parseFloat(String(data.amount_in ?? "0"))) {
        const paid = parseFloat(payment.amount);
        const fee = paid * FEE_RATE;
        await db.from("sep24_transactions").update({
          status: "completed",
          stellar_transaction_id: payment.txHash,
          amount_in: paid.toFixed(7),
          amount_fee: fee.toFixed(7),
          amount_out: (paid - fee).toFixed(2),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", txId);

        return {
          status: "completed",
          stellar_transaction_id: payment.txHash,
          spei_tracking_key: `MOCK_SPEI_${Date.now()}`,
        };
      }
    }

    return { status: data.status, stellar_transaction_id: data.stellar_transaction_id };
  }

  async simulateFiatReceived(txId: string): Promise<void> {
    // Reclamo atómico: solo una petición pasa de pending_user_transfer_start a pending_stellar,
    // así un doble clic o un reintento de red nunca envía TMXN dos veces.
    const { data: claimed } = await db
      .from("sep24_transactions")
      .update({ status: "pending_stellar", updated_at: new Date().toISOString() })
      .eq("id", txId)
      .eq("kind", "deposit")
      .eq("status", "pending_user_transfer_start")
      .select("*");
    const data = claimed?.[0];
    if (!data) {
      const { data: current } = await db.from("sep24_transactions").select("status").eq("id", txId).single();
      if (!current) throw new Error("No encontramos esta transacción.");
      if (current.status === "completed") throw new Error("Este depósito ya fue acreditado.");
      if (current.status === "pending_stellar") throw new Error("El envío ya está en curso, espera unos segundos.");
      throw new Error("Primero confirma la operación para obtener las instrucciones SPEI.");
    }

    const amount = String(data.amount_in ?? "100");
    const fee = parseFloat(amount) * FEE_RATE;
    const netAmount = (parseFloat(amount) - fee).toFixed(7);

    let txHash: string;
    try {
      // Envío real de TMXN en testnet (claimable balances no implementados en el mock)
      txHash = await sendTmxn(data.stellar_account, netAmount);
    } catch (e) {
      await db.from("sep24_transactions").update({
        status: "pending_user_transfer_start",
        updated_at: new Date().toISOString(),
      }).eq("id", txId);
      throw e;
    }

    await db.from("sep24_transactions").update({
      status: "completed",
      stellar_transaction_id: txHash,
      amount_out: netAmount,
      amount_fee: fee.toFixed(7),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", txId);
  }
}
