import { getDb } from "./supabase";
import { jsonCors } from "./cors";

/**
 * Estado de la base de datos del anchor (Supabase).
 *
 * Depósitos, retiros, historial y cotizaciones firmes viven en la base. Si el proyecto está pausado
 * o el host no resuelve, supabase-js reintenta las lecturas ~7 s antes de fallar; esta sonda corta
 * eso: un HEAD sin reintentos, con timeout, y el resultado se guarda unos segundos por instancia.
 */
export const DB_DOWN_MESSAGE =
  "La base de datos del anchor no está disponible: los depósitos y retiros de la demo están en pausa por ahora.";

const CONN_ERROR = /fetch failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|timeout|aborted|network/i;

/** ¿El error de Supabase es por no poder hablar con la base (no por datos inválidos)? */
export function isDbConnError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { message?: string; details?: string; code?: string; name?: string };
  return CONN_ERROR.test(`${e.message ?? ""} ${e.details ?? ""} ${e.code ?? ""} ${e.name ?? ""}`);
}

const UP_TTL = 5 * 60_000;
const DOWN_TTL = 30_000;
let last: { ok: boolean; at: number } | null = null;
let inflight: Promise<boolean> | null = null;

async function probe(): Promise<boolean> {
  try {
    const { error } = await getDb()
      .from("sep24_transactions")
      .select("id", { head: true, count: "exact" })
      .limit(1)
      .abortSignal(AbortSignal.timeout(3500))
      .retry(false);
    if (error) console.error("[db] probe", error.message);
    return !error;
  } catch (e) {
    console.error("[db] probe", e instanceof Error ? e.message : e);
    return false;
  }
}

/** true si la base responde. `fresh` ignora la caché (lo usa /api/health). */
export async function dbReachable(fresh = false): Promise<boolean> {
  if (!fresh && last && Date.now() - last.at < (last.ok ? UP_TTL : DOWN_TTL)) return last.ok;
  inflight ??= probe()
    .then((ok) => { last = { ok, at: Date.now() }; return ok; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Una consulta falló por conexión: las siguientes peticiones responden 503 sin esperar. */
export function markDbDown() {
  last = { ok: false, at: Date.now() };
}

/** 503 estándar de los endpoints que dependen de la base. */
export function dbUnavailable() {
  const res = jsonCors({ error: DB_DOWN_MESSAGE }, 503);
  res.headers.set("Retry-After", "60");
  return res;
}
