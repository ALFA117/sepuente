import { NextResponse } from "next/server";
import { dbReachable } from "@/lib/db-status";

export const dynamic = "force-dynamic";

/**
 * GET /api/health → { db: boolean }
 * Depósitos y retiros guardan su estado en la base de datos; si no responde, la demo lo avisa
 * en vez de fallar a medio flujo. SEP-1 y SEP-10 no dependen de ella.
 * La sonda no reintenta y corta a los 3.5 s, así que el aviso llega rápido aunque la base no exista.
 */
export async function GET() {
  const ok = await dbReachable(true);
  return NextResponse.json({ db: ok }, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
}
