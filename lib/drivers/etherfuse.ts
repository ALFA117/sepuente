import { env } from "../env";
import { db } from "../supabase";
import type {
  RampDriver,
  QuoteResult,
  DepositInstructions,
  WithdrawInstructions,
  DriverStatus,
} from "./types";
import type { TxStatus } from "../supabase";

// Mapa de estados Etherfuse → SEP-24
const STATUS_MAP: Record<string, TxStatus> = {
  pending: "pending_user_transfer_start",
  processing: "pending_anchor",
  completed: "completed",
  failed: "error",
  expired: "expired",
};

interface EfAsset {
  code: string;
  issuer: string;
  deposit_anchor_account?: string;
}

export class EtherfuseDriver implements RampDriver {
  private baseUrl = env.ETHERFUSE_BASE_URL;
  private apiKey = env.ETHERFUSE_API_KEY;

  private async req<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Etherfuse ${path} → ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  /** Obtiene el primer activo disponible en Etherfuse sandbox */
  private async getAsset(): Promise<EfAsset> {
    const data = await this.req<{ assets: EfAsset[] }>("/api/v1/assets");
    if (!data.assets?.length) throw new Error("No assets returned by Etherfuse");
    return data.assets[0];
  }

  async quote(params: {
    sell_asset: string;
    buy_asset: string;
    sell_amount?: string;
    buy_amount?: string;
  }): Promise<QuoteResult> {
    const isDeposit = params.sell_asset.startsWith("iso4217:");
    const amount = params.sell_amount ?? params.buy_amount ?? "100";

    const data = await this.req<{
      quote: {
        sell_amount: string;
        buy_amount: string;
        price: string;
        fee: string;
        expires_at: string;
      };
    }>("/api/v1/quotes", {
      method: "POST",
      body: JSON.stringify({
        type: isDeposit ? "deposit" : "withdrawal",
        amount,
        currency: "MXN",
      }),
    });

    return {
      sell_amount: data.quote.sell_amount,
      buy_amount: data.quote.buy_amount,
      price: data.quote.price,
      fee: data.quote.fee,
      expires_at: data.quote.expires_at,
    };
  }

  async createDeposit(params: {
    txId: string;
    stellarAccount: string;
    amount: string;
    quoteId?: string;
    claimableBalanceSupported?: boolean;
  }): Promise<DepositInstructions> {
    // Registra la wallet del usuario
    await this.req("/api/v1/wallets", {
      method: "POST",
      body: JSON.stringify({
        address: params.stellarAccount,
        network: "stellar",
      }),
    }).catch(() => null); // Ya puede existir

    const asset = await this.getAsset();
    const data = await this.req<{
      deposit: {
        clabe: string;
        reference: string;
        bank_name: string;
        beneficiary: string;
        order_id: string;
      };
    }>("/api/v1/deposits", {
      method: "POST",
      body: JSON.stringify({
        wallet_address: params.stellarAccount,
        asset_code: asset.code,
        asset_issuer: asset.issuer,
        amount: params.amount,
        transaction_id: params.txId,
      }),
    });

    await db.from("sep24_transactions").update({
      status: "pending_user_transfer_start",
      clabe: data.deposit.clabe,
      spei_reference: data.deposit.reference,
      driver_order_id: data.deposit.order_id,
      updated_at: new Date().toISOString(),
    }).eq("id", params.txId);

    return {
      clabe: data.deposit.clabe,
      reference: data.deposit.reference,
      bank_name: data.deposit.bank_name ?? "Etherfuse",
      beneficiary: data.deposit.beneficiary ?? "Etherfuse CETES",
    };
  }

  async createWithdraw(params: {
    txId: string;
    stellarAccount: string;
    amount: string;
    clabe: string;
    quoteId?: string;
  }): Promise<WithdrawInstructions> {
    // Verifica saldo y trustline antes de crear retiro
    const { horizon, tmxnAsset } = await import("../stellar");
    let acc;
    try {
      acc = await horizon.loadAccount(params.stellarAccount);
    } catch {
      throw new Error(
        "La cuenta Stellar no existe o no tiene suficiente XLM. " +
        "Asegúrate de tener al menos 1.5 XLM y trustline del activo."
      );
    }
    const asset = tmxnAsset();
    const hasTrust = acc.balances.some(
      (b: { asset_type: string; asset_code?: string; asset_issuer?: string }) =>
        b.asset_type !== "native" &&
        b.asset_code === asset.getCode() &&
        b.asset_issuer === asset.getIssuer()
    );
    if (!hasTrust) {
      throw new Error(
        `La cuenta no tiene trustline de ${asset.getCode()}. ` +
        "Agrégala antes de retirar."
      );
    }
    const xlm = acc.balances.find((b: { asset_type: string }) => b.asset_type === "native");
    if (!xlm || parseFloat((xlm as { balance: string }).balance) < 1.5) {
      throw new Error("La cuenta necesita al menos 1.5 XLM para cubrir reservas y fees.");
    }

    // Crea retiro en Etherfuse anchor mode
    const efAsset = await this.getAsset();
    const data = await this.req<{
      withdrawal: {
        anchor_account: string;
        anchor_memo: string;
        anchor_memo_type: "text" | "id" | "hash";
        order_id: string;
      };
    }>("/api/v1/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        wallet_address: params.stellarAccount,
        asset_code: efAsset.code,
        asset_issuer: efAsset.issuer,
        amount: params.amount,
        destination_clabe: params.clabe,
        transaction_id: params.txId,
      }),
    });

    await db.from("sep24_transactions").update({
      status: "pending_user_transfer_start",
      anchor_account: data.withdrawal.anchor_account,
      anchor_memo: data.withdrawal.anchor_memo,
      anchor_memo_type: data.withdrawal.anchor_memo_type,
      driver_order_id: data.withdrawal.order_id,
      updated_at: new Date().toISOString(),
    }).eq("id", params.txId);

    return {
      anchor_account: data.withdrawal.anchor_account,
      anchor_memo: data.withdrawal.anchor_memo,
      anchor_memo_type: data.withdrawal.anchor_memo_type,
    };
  }

  async getStatus(txId: string): Promise<DriverStatus> {
    const { data: tx } = await db
      .from("sep24_transactions")
      .select("*")
      .eq("id", txId)
      .single();
    if (!tx?.driver_order_id)
      return { status: tx?.status ?? "incomplete" };

    const orderType = tx.kind === "deposit" ? "deposits" : "withdrawals";
    const order = await this.req<{
      status: string;
      stellar_transaction_id?: string;
      spei_tracking_key?: string;
    }>(`/api/v1/${orderType}/${tx.driver_order_id}`).catch(() => null);

    if (!order) return { status: tx.status };

    const mapped: TxStatus = STATUS_MAP[order.status] ?? tx.status;
    if (mapped !== tx.status) {
      await db.from("sep24_transactions").update({
        status: mapped,
        stellar_transaction_id: order.stellar_transaction_id,
        updated_at: new Date().toISOString(),
        ...(mapped === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      }).eq("id", txId);
    }

    return {
      status: mapped,
      stellar_transaction_id: order.stellar_transaction_id,
      spei_tracking_key: order.spei_tracking_key,
    };
  }
}
