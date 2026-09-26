/** GABC…WXYZ: conserva inicio y fin para que direcciones y hashes nunca desborden. */
export function truncateMiddle(value: string | null | undefined, head = 6, tail = 6): string {
  if (!value) return "—";
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatAmount(value: string | number | null | undefined, decimals = 2): string {
  const n = typeof value === "number" ? value : parseFloat(value ?? "");
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export const EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx/";
export const EXPLORER_ACCOUNT = "https://stellar.expert/explorer/testnet/account/";
