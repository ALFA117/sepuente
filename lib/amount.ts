export const MIN_AMOUNT = 10;
export const MAX_AMOUNT = 50000;

export function amountError(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return "Escribe un monto válido, con máximo 2 decimales.";
  const n = Number(value);
  if (n < MIN_AMOUNT) return `El monto mínimo es $${MIN_AMOUNT} MXN.`;
  if (n > MAX_AMOUNT) return `El monto máximo es $${MAX_AMOUNT.toLocaleString("es-MX")} MXN.`;
  return null;
}
