import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { formatQuote } from "@/lib/sep38";
import { dbReachable, dbUnavailable, isDbConnError, markDbDown } from "@/lib/db-status";

export const dynamic = "force-dynamic";
export async function OPTIONS() { return optionsResponse(); }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET /sep38/quote/:id — devuelve la misma cotización que se creó (vigente o vencida). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSep10(req);
  if ("error" in auth) return jsonCors({ error: auth.error }, auth.status);
  const { claims } = auth;

  const { id } = await params;
  if (!UUID.test(id)) return jsonCors({ error: "Quote not found" }, 404);

  if (!(await dbReachable())) return dbUnavailable();

  const { data, error } = await db.from("sep38_quotes").select("*").eq("id", id).eq("stellar_account", claims.account).maybeSingle();
  if (error) {
    console.error("[sep38/quote/:id]", error.message);
    if (isDbConnError(error)) { markDbDown(); return dbUnavailable(); }
    return jsonCors({ error: "Could not read the quote" }, 500);
  }
  if (!data) return jsonCors({ error: "Quote not found" }, 404);

  return jsonCors(formatQuote(data));
}
