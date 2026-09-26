type HorizonError = {
  response?: { status?: number; data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } };
};

export function describeError(e: unknown): string {
  const codes = (e as HorizonError)?.response?.data?.extras?.result_codes;
  const ops = codes?.operations ?? [];
  if (ops.includes("op_no_trust")) return "La wallet no tiene trustline de TMXN. Agrégala antes de continuar.";
  if (ops.includes("op_underfunded")) return "Saldo insuficiente para completar el envío.";
  if (ops.includes("op_no_destination")) return "La cuenta destino no existe en testnet. Fondéala con el faucet primero.";
  if (codes?.transaction === "tx_bad_seq") return "La red rechazó la secuencia de la transacción. Intenta de nuevo.";
  if (codes) return `Stellar rechazó la transacción (${[codes.transaction, ...ops].filter(Boolean).join(", ")}).`;
  if ((e as HorizonError)?.response?.status === 404) return "La cuenta no existe en Stellar testnet.";
  const msg = e instanceof Error ? e.message : "";
  return msg && msg.length < 200 ? msg : "Ocurrió un error inesperado. Intenta de nuevo en unos segundos.";
}
