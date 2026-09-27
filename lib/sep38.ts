import { getDriver } from "./drivers";
import { FIAT_ASSET, stellarAsset } from "./sep24";

export const QUOTE_CONTEXTS = ["sep6", "sep24", "sep31"] as const;
export const SPEI_METHOD = { name: "SPEI", description: "Transferencia interbancaria SPEI (México)" };

/** Decimales por activo: MXN en centavos, activos Stellar con 7. */
export const decimalsFor = (asset: string) => (asset === FIAT_ASSET ? 2 : 7);
const fmt = (asset: string, v: number | string) => Number(v).toFixed(decimalsFor(asset));
const fmtPrice = (v: number) => v.toFixed(7);

export function isSupportedPair(sell: string, buy: string) {
  const s = stellarAsset();
  return (sell === FIAT_ASSET && buy === s) || (sell === s && buy === FIAT_ASSET);
}

export interface Priced {
  sell_asset: string;
  buy_asset: string;
  sell_amount: string;
  buy_amount: string;
  price: string;
  total_price: string;
  fee: { total: string; asset: string };
  expires_at: string;
}

/**
 * Cotiza siguiendo las fórmulas de SEP-38 con la comisión en el activo vendido:
 *   sell_amount = total_price * buy_amount
 *   sell_amount - fee = price * buy_amount
 */
export async function priceFor(input: {
  sell_asset: string;
  buy_asset: string;
  sell_amount?: string | null;
  buy_amount?: string | null;
}): Promise<Priced> {
  const { sell_asset, buy_asset } = input;
  if (!isSupportedPair(sell_asset, buy_asset)) throw new Error("Unsupported asset pair");
  if (!!input.sell_amount === !!input.buy_amount) throw new Error("Provide exactly one of 'sell_amount' or 'buy_amount'");
  const given = Number(input.sell_amount ?? input.buy_amount);
  if (!Number.isFinite(given) || given <= 0) throw new Error("Amount must be a positive number");

  // El driver cotiza a partir de lo vendido. Si piden un monto a comprar, primero se estima lo vendido.
  const driver = getDriver();
  const probe = await driver.quote({ sell_asset, buy_asset, sell_amount: "100" });
  const rate = Number(probe.buy_amount) / 100; // unidades compradas por unidad vendida, ya con comisión
  const sellAmount = input.sell_amount ? given : given / rate;

  const q = await driver.quote({ sell_asset, buy_asset, sell_amount: fmt(sell_asset, sellAmount) });
  const sell = Number(fmt(sell_asset, q.sell_amount));
  const buy = Number(input.buy_amount ? fmt(buy_asset, given) : fmt(buy_asset, q.buy_amount));
  const fee = Number(fmt(sell_asset, q.fee));

  return {
    sell_asset,
    buy_asset,
    sell_amount: fmt(sell_asset, sell),
    buy_amount: fmt(buy_asset, buy),
    price: fmtPrice((sell - fee) / buy),
    total_price: fmtPrice(sell / buy),
    fee: { total: fmt(sell_asset, fee), asset: sell_asset },
    expires_at: new Date(q.expires_at).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatQuote(row: any) {
  const sell = Number(row.sell_amount);
  const buy = Number(row.buy_amount);
  const fee = Number(row.fee);
  return {
    id: row.id,
    expires_at: new Date(row.expires_at).toISOString(),
    price: fmtPrice((sell - fee) / buy),
    total_price: fmtPrice(sell / buy),
    fee: { total: fmt(row.sell_asset, fee), asset: row.sell_asset },
    sell_asset: row.sell_asset,
    buy_asset: row.buy_asset,
    sell_amount: fmt(row.sell_asset, sell),
    buy_amount: fmt(row.buy_asset, buy),
    ...(row.sell_asset === FIAT_ASSET ? { sell_delivery_method: SPEI_METHOD.name } : {}),
    ...(row.buy_asset === FIAT_ASSET ? { buy_delivery_method: SPEI_METHOD.name } : {}),
  };
}
