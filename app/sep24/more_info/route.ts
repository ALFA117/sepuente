import { NextRequest } from "next/server";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { txStatus } from "@/lib/status";
import { formatAmount, truncateMiddle, EXPLORER_TX } from "@/lib/format";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Documento autónomo (no pasa por el layout de React): se sirve completo y sin streaming,
// para que cualquier cliente SEP-24 pueda leerlo. Los colores replican los tokens de globals.css.
function page(title: string, body: string, status = 200) {
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex"><title>${esc(title)} · SEPuente</title>
<style>
:root{color-scheme:dark;--bg:#0A1A33;--surface:#11284D;--gold:#C9A227;--cream:#F5F1E6;--muted:#B8C2D6;--line:rgb(72 98 142/.45);--ok:#4FB280;--warn:#E2A848;--info:#8FB3E0;--bad:#E56660}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--cream);font:16px/1.6 Inter,system-ui,-apple-system,sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px 32px}
main{max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.brand{font:700 1.2rem Georgia,serif;color:var(--cream);text-decoration:none}.brand b{color:var(--gold)}
.eyebrow{font:500 .75rem ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
h1{font:700 1.8rem/1.15 Georgia,serif}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:4px 20px}
.row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.row:last-child{border:0}
.k{color:var(--muted);font-size:.875rem}.v{font-family:ui-monospace,monospace;text-align:right;overflow-wrap:anywhere}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font:600 .75rem Inter,sans-serif}
.success{color:var(--ok);background:rgb(79 178 128/.14)}.warning{color:var(--warn);background:rgb(226 168 72/.14)}.info{color:var(--info);background:rgb(143 179 224/.14)}.danger{color:var(--bad);background:rgb(229 102 96/.14)}.neutral{color:var(--muted);background:rgb(184 194 214/.1)}
a.btn{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:12px;border:1px solid var(--line);background:#173564;color:var(--cream);font-weight:600;text-decoration:none}
p.note{color:var(--muted);font-size:.875rem}
</style></head><body><main>
<a class="brand" href="${esc(env.APP_URL)}"><b>SEP</b>uente</a>
${body}
</main></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

/** more_info_url de SEP-24: detalle público de una operación, sin CLABE ni datos bancarios. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const notFound = () => page("Operación no encontrada", `<h1>Operación no encontrada</h1><p class="note">Revisa el enlace que te dio tu wallet.</p>`, 404);
  if (!UUID.test(id)) return notFound();

  const { data: tx } = await db.from("sep24_transactions").select("*").eq("id", id).maybeSingle();
  if (!tx) return notFound();

  const isDeposit = tx.kind === "deposit";
  const s = txStatus(tx.status);
  const inUnit = isDeposit ? "MXN" : env.ASSET_CODE;
  const outUnit = isDeposit ? env.ASSET_CODE : "MXN";
  const date = (v?: string | null) =>
    v ? new Date(v).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }) : "—";
  const row = (k: string, v: string) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${v}</span></div>`;

  const body = `
<p class="eyebrow">Operación SEP-24</p>
<h1>${isDeposit ? "Depósito" : "Retiro"} de pesos</h1>
<div class="card">
${row("Estado", `<span class="badge ${s.tone}">${esc(s.label)}</span>`)}
${row("Envías", tx.amount_in ? esc(`${formatAmount(tx.amount_in)} ${inUnit}`) : "—")}
${row("Recibes", tx.amount_out ? esc(`${formatAmount(tx.amount_out)} ${outUnit}`) : "—")}
${row("Comisión", tx.amount_fee ? esc(`${formatAmount(tx.amount_fee, 4)} ${inUnit}`) : "—")}
${row("Iniciada", esc(date(tx.started_at)))}
${row("Completada", esc(date(tx.completed_at)))}
${row("Cuenta Stellar", esc(truncateMiddle(tx.stellar_account, 8, 8)))}
${row("ID", esc(truncateMiddle(tx.id, 8, 6)))}
</div>
${tx.stellar_transaction_id ? `<a class="btn" href="${EXPLORER_TX}${esc(tx.stellar_transaction_id)}" target="_blank" rel="noreferrer">Ver transacción en stellar.expert</a>` : ""}
<p class="note">Red de prueba de Stellar. El SPEI de esta demo es simulado.</p>`;

  return page(`${isDeposit ? "Depósito" : "Retiro"} ${s.label}`, body);
}
