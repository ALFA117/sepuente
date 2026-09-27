import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { txStatus } from "@/lib/status";
import { formatAmount, truncateMiddle, EXPLORER_TX } from "@/lib/format";
import { SiteHeader, SiteFooter } from "../../components/SiteHeader";
import ui from "../../components/ui.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalle de operación · SEPuente", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** more_info_url de SEP-24: detalle público de una operación (sin CLABE ni datos bancarios). */
export default async function MoreInfoPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id || !UUID.test(id)) notFound();

  const { data: tx } = await db.from("sep24_transactions").select("*").eq("id", id).maybeSingle();
  if (!tx) notFound();

  const isDeposit = tx.kind === "deposit";
  const s = txStatus(tx.status);
  const inUnit = isDeposit ? "MXN" : env.ASSET_CODE;
  const outUnit = isDeposit ? env.ASSET_CODE : "MXN";
  const date = (v?: string | null) => (v ? new Date(v).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }) : "—");

  return (
    <div className={styles.page}>
      <SiteHeader badge="Testnet" />
      <main id="main" className={styles.main}>
        <p className={ui.eyebrow}>Operación SEP-24</p>
        <h1 className={styles.title}>{isDeposit ? "Depósito" : "Retiro"} de pesos</h1>
        <div className={ui.card}>
          <div className={ui.kvList}>
            <div className={ui.kv}><span className={ui.kvKey}>Estado</span><span className={`${ui.badge} ${ui[`tone-${s.tone}`]}`}>{s.label}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Envías</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{tx.amount_in ? `${formatAmount(tx.amount_in)} ${inUnit}` : "—"}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Recibes</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{tx.amount_out ? `${formatAmount(tx.amount_out)} ${outUnit}` : "—"}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Comisión</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{tx.amount_fee ? `${formatAmount(tx.amount_fee, 4)} ${inUnit}` : "—"}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Iniciada</span><span className={ui.kvVal}>{date(tx.started_at)}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Completada</span><span className={ui.kvVal}>{date(tx.completed_at)}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Cuenta Stellar</span><span className={`${ui.kvVal} ${ui.kvMono}`} title={tx.stellar_account}>{truncateMiddle(tx.stellar_account, 8, 8)}</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>ID</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{truncateMiddle(tx.id, 8, 6)}</span></div>
          </div>
        </div>
        {tx.stellar_transaction_id && (
          <a className={`${ui.btn} ${ui.secondary} ${ui.btnBlock}`} href={`${EXPLORER_TX}${tx.stellar_transaction_id}`} target="_blank" rel="noreferrer">
            Ver transacción en stellar.expert
          </a>
        )}
        <p className={ui.muted}>Red de prueba de Stellar. El SPEI de esta demo es simulado.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
