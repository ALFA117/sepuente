import type { TxStatus } from "../supabase";

export interface QuoteResult {
  sell_amount: string;
  buy_amount: string;
  price: string;          // buy_asset por unidad de sell_asset
  fee: string;
  expires_at: string;     // ISO
}

export interface DepositInstructions {
  clabe: string;
  reference: string;      // referencia SPEI que el usuario debe incluir
  bank_name: string;
  beneficiary: string;
}

export interface WithdrawInstructions {
  anchor_account: string; // cuenta Stellar a la que el usuario paga
  anchor_memo: string;
  anchor_memo_type: "text" | "id" | "hash";
}

export interface DriverStatus {
  status: TxStatus;
  stellar_transaction_id?: string;
  spei_tracking_key?: string;
  error_message?: string;
}

export interface RampDriver {
  /**
   * Cotiza sellAsset → buyAsset.
   * Para depósito: sell_asset = iso4217:MXN, buy_asset = stellar:TMXN:ISSUER
   * Para retiro: sell_asset = stellar:TMXN:ISSUER, buy_asset = iso4217:MXN
   */
  quote(params: {
    sell_asset: string;
    buy_asset: string;
    sell_amount?: string;
    buy_amount?: string;
  }): Promise<QuoteResult>;

  createDeposit(params: {
    txId: string;
    stellarAccount: string;
    amount: string;
    quoteId?: string;
    claimableBalanceSupported?: boolean;
  }): Promise<DepositInstructions>;

  createWithdraw(params: {
    txId: string;
    stellarAccount: string;
    amount: string;
    clabe: string;
    quoteId?: string;
  }): Promise<WithdrawInstructions>;

  getStatus(txId: string): Promise<DriverStatus>;

  /** Solo MockDriver: simula recepción del SPEI */
  simulateFiatReceived?(txId: string): Promise<void>;
}
