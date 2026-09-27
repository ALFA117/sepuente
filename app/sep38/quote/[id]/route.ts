import { NextRequest } from "next/server";
import { jsonCors, optionsResponse } from "@/lib/cors";
import { requireSep10 } from "@/lib/auth-middleware";
import { db } from "@/lib/supabase";
import { formatQuote } from "@/lib/sep38";

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

  const { data } = await db.from("sep38_quotes").select("*").eq("id", id).eq("stellar_account", claims.account).maybeSingle();
  if (!data) return jsonCors({ error: "Quote not found" }, 404);

  return jsonCors(formatQuote(data));
}
