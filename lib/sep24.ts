import { env } from "./env";

/** Comisión del anchor en porcentaje (el MockDriver cobra 0.5 %). */
export const FEE_PERCENT = 0.5;

export const stellarAsset = () => `stellar:${env.ASSET_CODE}:${env.ISSUER_PUBLIC_KEY}`;
export const FIAT_ASSET = "iso4217:MXN";

export function isSupportedAsset(code: string | null | undefined): boolean {
  return !!code && code === env.ASSET_CODE;
}

const amount = (v: unknown): string | undefined =>
  v === null || v === undefined || v === "" ? undefined : String(v);

const iso = (v: unknown): string | undefined => (v ? new Date(String(v)).toISOString() : undefined);

/** Quita claves con valor null/undefined: el esquema SEP-24 valida tipos estrictos. */
function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatSep24Tx(row: any) {
  const isDeposit = row.kind === "deposit";
  const inAsset = isDeposit ? FIAT_ASSET : stellarAsset();
  const outAsset = isDeposit ? stellarAsset() : FIAT_ASSET;
  const amountIn = amount(row.amount_in);
  const amountOut = amount(row.amount_out);
  const amountFee = amount(row.amount_fee);

  return clean({
    id: row.id,
    kind: row.kind,
    status: row.status,
    more_info_url: `${env.APP_URL}/sep24/more_info?id=${row.id}`,
    amount_in: amountIn,
    amount_in_asset: amountIn ? inAsset : undefined,
    amount_out: amountOut,
    amount_out_asset: amountOut ? outAsset : undefined,
    amount_fee: amountFee,
    amount_fee_asset: amountFee ? inAsset : undefined,
    started_at: iso(row.started_at),
    updated_at: iso(row.updated_at),
    completed_at: iso(row.completed_at),
    stellar_transaction_id: row.stellar_transaction_id,
    external_transaction_id: row.spei_reference,
    message: row.error_message,
    refunded: false,
    // Depósito: a dónde llegan los TMXN
    to: isDeposit ? row.stellar_account : undefined,
    deposit_memo: isDeposit ? row.spei_reference : undefined,
    deposit_memo_type: isDeposit && row.spei_reference ? "text" : undefined,
    claimable_balance_id: row.claimable_balance_id,
    // Retiro: a dónde paga la wallet
    from: !isDeposit ? row.stellar_account : undefined,
    withdraw_anchor_account: !isDeposit ? row.anchor_account : undefined,
    withdraw_memo: !isDeposit ? row.anchor_memo : undefined,
    withdraw_memo_type: !isDeposit && row.anchor_memo ? row.anchor_memo_type ?? "text" : undefined,
  });
}
