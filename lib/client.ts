// Utilidades de red para componentes cliente: timeout, cuerpo vacío tolerado y mensajes humanos.
export interface JsonResult<T> {
  ok: boolean;
  status: number;
  data: T & { error?: string; detail?: string };
}

export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 20000
): Promise<JsonResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const name = (e as Error)?.name;
    throw new Error(
      name === "TimeoutError" || name === "AbortError"
        ? "La red tardó demasiado en responder. Revisa tu conexión e intenta de nuevo."
        : "No pudimos conectar con el servidor. Revisa tu conexión."
    );
  }
  const text = await res.text();
  let data = {} as JsonResult<T>["data"];
  try { data = text ? JSON.parse(text) : data; } catch { /* respuesta no-JSON */ }
  return { ok: res.ok, status: res.status, data };
}

export function errorText(r: JsonResult<unknown>, fallback: string): string {
  return r.data?.error ?? r.data?.detail ?? `${fallback} (código ${r.status})`;
}

type HorizonErrorBody = { extras?: { result_codes?: { transaction?: string; operations?: string[] } }; detail?: string };

export function horizonError(body: HorizonErrorBody, fallback: string): string {
  const codes = body?.extras?.result_codes;
  const ops = codes?.operations ?? [];
  if (ops.includes("op_underfunded")) return "No tienes saldo suficiente para este envío.";
  if (ops.includes("op_no_trust")) return "Falta la trustline del activo en alguna de las cuentas.";
  if (ops.includes("op_low_reserve")) return "Necesitas más XLM para cubrir la reserva mínima.";
  if (codes?.transaction === "tx_insufficient_fee") return "La red está congestionada. Intenta de nuevo.";
  if (codes?.transaction === "tx_bad_seq") return "La cuenta cambió mientras firmabas. Intenta de nuevo.";
  if (codes) return `Stellar rechazó la transacción (${[codes.transaction, ...ops].filter(Boolean).join(", ")}).`;
  return fallback;
}
