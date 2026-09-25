import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

// Cliente lazy: se instancia solo cuando se usa (evita error en build sin env vars)
let _db: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!_db) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas");
    }
    _db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _db;
}

// Alias para retrocompatibilidad con código existente
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type TxStatus =
  | "incomplete"
  | "pending_user_transfer_start"
  | "pending_anchor"
  | "pending_stellar"
  | "completed"
  | "error"
  | "expired"
  | "refunded";

export interface Sep24Transaction {
  id: string;
  kind: "deposit" | "withdrawal";
  status: TxStatus;
  stellar_account: string;
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  asset_code: string;
  asset_issuer: string;
  clabe?: string;
  spei_reference?: string;
  stellar_transaction_id?: string;
  more_info_url?: string;
  started_at: string;
  completed_at?: string;
  updated_at: string;
  driver_order_id?: string;
  anchor_account?: string;
  anchor_memo?: string;
  anchor_memo_type?: string;
  claimable_balance_id?: string;
  error_message?: string;
}

export interface Sep38Quote {
  id: string;
  sell_asset: string;
  buy_asset: string;
  sell_amount: string;
  buy_amount: string;
  price: string;
  fee: string;
  expires_at: string;
  created_at: string;
  stellar_account?: string;
}
