"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";
import styles from "./page.module.css";

const TESTNET = "https://horizon-testnet.stellar.org";

interface Tx {
  id: string;
  kind: string;
  status: string;
  amount_in?: string;
  amount_out?: string;
  started_at: string;
  stellar_transaction_id?: string;
}

interface AccountInfo {
  publicKey: string;
  secretKey: string;
  xlmBalance?: string;
  tmxnBalance?: string;
}

export default function Home() {
  const ASSET_CODE = process.env.NEXT_PUBLIC_ASSET_CODE ?? "TMXN";
  const ISSUER = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? "";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [jwt, setJwt] = useState("");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [hasTrustline, setHasTrustline] = useState(false);

  // Carga o genera wallet de prueba desde sessionStorage
  useEffect(() => {
    let kp: Keypair;
    const stored = sessionStorage.getItem("sp_keypair");
    if (stored) {
      try { kp = Keypair.fromSecret(stored); }
      catch { kp = Keypair.random(); sessionStorage.setItem("sp_keypair", kp.secret()); }
    } else {
      kp = Keypair.random();
      sessionStorage.setItem("sp_keypair", kp.secret());
    }
    setAccount({ publicKey: kp.publicKey(), secretKey: kp.secret() });
  }, []);

  const loadBalances = useCallback(async () => {
    if (!account) return;
    try {
      const res = await fetch(`${TESTNET}/accounts/${account.publicKey}`);
      if (!res.ok) {
        setAccount((a) => a ? { ...a, xlmBalance: "0 (sin fondear)", tmxnBalance: "—" } : a);
        return;
      }
      const data = await res.json();
      let xlm = "0", tmxn = "0";
      let trust = false;
      for (const b of data.balances) {
        if (b.asset_type === "native") xlm = parseFloat(b.balance).toFixed(4);
        if (b.asset_code === ASSET_CODE && b.asset_issuer === ISSUER) {
          tmxn = parseFloat(b.balance).toFixed(4);
          trust = true;
        }
      }
      setHasTrustline(trust);
      setAccount((a) => a ? { ...a, xlmBalance: `${xlm} XLM`, tmxnBalance: `${tmxn} ${ASSET_CODE}` } : a);
    } catch {
      setAccount((a) => a ? { ...a, xlmBalance: "Error", tmxnBalance: "Error" } : a);
    }
  }, [account?.publicKey, ASSET_CODE, ISSUER]);

  useEffect(() => {
    if (account?.publicKey) loadBalances();
  }, [account?.publicKey]);

  async function handleFaucet() {
    if (!account) return;
    setLoading((l) => ({ ...l, faucet: true }));
    setErr(""); setMsg("");
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: account.publicKey }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error); return; }
      setMsg("Fondeo con XLM exitoso. Agrega la trustline para recibir " + ASSET_CODE);
      await loadBalances();
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading((l) => ({ ...l, faucet: false })); }
  }

  async function handleTrustline() {
    if (!account || !ISSUER) return;
    setLoading((l) => ({ ...l, trust: true }));
    setErr(""); setMsg("");
    try {
      const kp = Keypair.fromSecret(account.secretKey);
      const accRes = await fetch(`${TESTNET}/accounts/${account.publicKey}`);
      if (!accRes.ok) { setErr("Fondea la cuenta primero con el faucet"); return; }
      const accData = await accRes.json();
      const asset = new Asset(ASSET_CODE, ISSUER);

      const tx = new TransactionBuilder(accData, {
        fee: "100000",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(Operation.changeTrust({ asset }))
        .setTimeout(30)
        .build();
      tx.sign(kp);

      const res = await fetch(`${TESTNET}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `tx=${encodeURIComponent(tx.toEnvelope().toXDR("base64"))}`,
      });
      const result = await res.json();
      if (!res.ok) { setErr(result.detail ?? "Error al agregar trustline"); return; }
      setMsg(`Trustline de ${ASSET_CODE} agregada ✓`);
      setHasTrustline(true);
      await loadBalances();
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading((l) => ({ ...l, trust: false })); }
  }

  async function handleLogin() {
    if (!account) return;
    setLoading((l) => ({ ...l, login: true }));
    setErr(""); setMsg("");
    try {
      const kp = Keypair.fromSecret(account.secretKey);
      // GET challenge
      const chRes = await fetch(`/auth?account=${account.publicKey}`);
      const ch = await chRes.json();
      if (!chRes.ok) { setErr(ch.error); return; }

      // Sign challenge
      const tx = TransactionBuilder.fromXDR(ch.transaction, ch.network_passphrase);
      tx.sign(kp);
      const signed = tx.toEnvelope().toXDR("base64");

      // POST signed
      const authRes = await fetch("/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: signed, network_passphrase: ch.network_passphrase }),
      });
      const authData = await authRes.json();
      if (!authRes.ok) { setErr(authData.error); return; }
      setJwt(authData.token);
      setMsg("Autenticado con SEP-10 ✓");
      await loadTxs(authData.token);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading((l) => ({ ...l, login: false })); }
  }

  async function loadTxs(token: string) {
    try {
      const res = await fetch("/sep24/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTxs(data.transactions ?? []);
    } catch { /**/ }
  }

  function openInteractive(kind: "deposit" | "withdraw") {
    if (!APP_URL) return;
    // Primero necesitamos JWT → inicia la operación vía SEP-24
    const url = `${APP_URL}/sep24/transactions/${kind}/interactive`;
    // Llamamos a la API con el JWT y abrimos la URL interactiva
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ asset_code: ASSET_CODE }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          window.open(data.url, "sep24_popup", "width=480,height=700");
          setTimeout(() => loadTxs(jwt), 3000);
        } else {
          setErr(data.error ?? "No URL returned");
        }
      })
      .catch((e: Error) => setErr(e.message));
  }

  const statusColor: Record<string, string> = {
    incomplete: "#8B9BB5",
    pending_user_transfer_start: "#C9A227",
    pending_anchor: "#7ab3f5",
    completed: "#4CAF82",
    error: "#E05252",
    expired: "#E05252",
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoAlpha}>⟴</span>
          <span>SEPuente</span>
        </div>
        <p className={styles.tagline}>
          Anchor SEP-24 no custodial · Solo testnet · Cualquier wallet compatible puede conectarse
        </p>
      </header>

      <div className={styles.notice}>
        Esta app es solo un <strong>cliente de ejemplo</strong>. El protocolo SEPuente está expuesto en{" "}
        <code>{APP_URL || "este dominio"}</code> y cualquier wallet compatible puede usarlo.{" "}
        <a href="/devs">Docs para devs →</a>
      </div>

      <div className={styles.grid}>
        {/* ── Wallet ── */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Wallet testnet</h2>
          {account ? (
            <>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Clave pública</span>
                <code className={styles.code}>{account.publicKey.slice(0, 8)}…{account.publicKey.slice(-4)}</code>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>XLM</span>
                <span>{account.xlmBalance ?? "—"}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{ASSET_CODE}</span>
                <span>{account.tmxnBalance ?? "—"}</span>
              </div>
              <div className={styles.btnRow}>
                <button className={styles.btnSec} onClick={handleFaucet} disabled={!!loading.faucet}>
                  {loading.faucet ? "Fondeando…" : "🪙 Faucet XLM"}
                </button>
                {!hasTrustline && (
                  <button className={styles.btnSec} onClick={handleTrustline} disabled={!!loading.trust}>
                    {loading.trust ? "Agregando…" : `+ Trustline ${ASSET_CODE}`}
                  </button>
                )}
              </div>
              {!jwt ? (
                <button className={styles.btnPrimary} onClick={handleLogin} disabled={!!loading.login} style={{ marginTop: 12 }}>
                  {loading.login ? "Autenticando…" : "Iniciar sesión (SEP-10)"}
                </button>
              ) : (
                <p className={styles.authBadge}>✓ Sesión SEP-10 activa</p>
              )}
            </>
          ) : (
            <p className={styles.muted}>Generando wallet…</p>
          )}
        </section>

        {/* ── Operaciones ── */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Operaciones</h2>
          {!jwt ? (
            <p className={styles.muted}>Inicia sesión con SEP-10 para operar.</p>
          ) : (
            <div className={styles.opBtns}>
              <button
                className={styles.opBtn}
                onClick={() => openInteractive("deposit")}
              >
                <span className={styles.opIcon}>⬇</span>
                <div>
                  <div className={styles.opLabel}>Depositar</div>
                  <div className={styles.opDesc}>SPEI → {ASSET_CODE}</div>
                </div>
              </button>
              <button
                className={styles.opBtn}
                onClick={() => openInteractive("withdraw")}
              >
                <span className={styles.opIcon}>⬆</span>
                <div>
                  <div className={styles.opLabel}>Retirar</div>
                  <div className={styles.opDesc}>{ASSET_CODE} → SPEI</div>
                </div>
              </button>
            </div>
          )}
          {msg && <p className={styles.success}>{msg}</p>}
          {err && <p className={styles.err}>{err}</p>}
        </section>
      </div>

      {/* ── Historial ── */}
      {txs.length > 0 && (
        <section className={styles.history}>
          <h2 className={styles.histTitle}>Historial</h2>
          <div className={styles.txList}>
            {txs.map((tx) => (
              <div key={tx.id} className={styles.txRow}>
                <div className={styles.txKind}>{tx.kind === "deposit" ? "⬇" : "⬆"}</div>
                <div className={styles.txInfo}>
                  <div className={styles.txAmount}>
                    {tx.amount_out ?? tx.amount_in ?? "—"} {tx.kind === "deposit" ? ASSET_CODE : "MXN"}
                  </div>
                  <div className={styles.txDate}>{new Date(tx.started_at).toLocaleString("es-MX")}</div>
                </div>
                <div>
                  <span
                    className={styles.txStatus}
                    style={{ color: statusColor[tx.status] ?? "#8B9BB5" }}
                  >
                    {tx.status.replace(/_/g, " ")}
                  </span>
                  {tx.stellar_transaction_id && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.stellar_transaction_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.txLink}
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className={styles.btnSec} style={{ marginTop: 12 }} onClick={() => loadTxs(jwt)}>
            Actualizar historial
          </button>
        </section>
      )}

      <footer className={styles.footer}>
        <a href="/devs">Documentación para devs</a>
        {" · "}
        <a
          href="https://github.com/ALFA117/sepuente"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        {" · "}
        <span className={styles.muted}>Stellar Testnet</span>
      </footer>
    </main>
  );
}
