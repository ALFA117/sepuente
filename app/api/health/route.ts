import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/health → { db: boolean }
 * Depósitos y retiros guardan su estado en la base de datos; si no responde, la demo lo avisa
 * en vez de fallar a medio flujo. SEP-1 y SEP-10 no dependen de ella.
 */
export async function GET() {
  let ok = false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const { error } = await db
      .from("sep24_transactions")
      .select("id", { head: true, count: "exact" })
      .limit(1)
      .abortSignal(ctrl.signal);
    clearTimeout(timer);
    ok = !error;
    if (error) console.error("[health] db", error.message);
  } catch (e) {
    console.error("[health] db", e instanceof Error ? e.message : e);
  }
  return NextResponse.json({ db: ok }, { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } });
}
