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
    const sellAmt = parseFloat(params.sell_amount ?? params.buy_amount ?? "100");
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
    const clabe = "646180157000000004"; // CLABE ficticia de Etherfuse sandbox

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

      if (payment) {
        await db.from("sep24_transactions").update({
          status: "completed",
          stellar_transaction_id: payment.txHash,
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
    const { data } = await db
      .from("sep24_transactions")
      .select("*")
      .eq("id", txId)
      .single();
    if (!data) throw new Error("tx not found");
    if (data.status !== "pending_user_transfer_start") {
      throw new Error(`Cannot simulate: status is ${data.status}`);
    }

    // Envía TMXN real desde DISTRIBUTION a la wallet del usuario
    const amount = data.amount_in ?? "100";
    const fee = parseFloat(amount) * FEE_RATE;
    const netAmount = (parseFloat(amount) - fee).toFixed(7);

    let txHash: string;
    if (data.claimable_balance_id) {
      // Crear claimable balance — simplificado: envío directo
      txHash = await sendTmxn(data.stellar_account, netAmount);
    } else {
      txHash = await sendTmxn(data.stellar_account, netAmount);
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
