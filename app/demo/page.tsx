"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Account,
} from "@stellar/stellar-sdk";
import Link from "next/link";
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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  incomplete:                  { bg: "rgba(139,155,181,0.1)",  color: "#8B9BB5" },
  pending_user_transfer_start: { bg: "rgba(212,168,67,0.12)",  color: "#D4A843" },
  pending_anchor:              { bg: "rgba(79,158,248,0.12)",   color: "#7DBAFF" },
  completed:                   { bg: "rgba(47,191,113,0.12)",   color: "#4CD68E" },
  error:                       { bg: "rgba(224,82,82,0.1)",     color: "#F07070" },
  expired:                     { bg: "rgba(224,82,82,0.1)",     color: "#F07070" },
};

export default function DemoPage() {
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
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Carga o genera wallet desde sessionStorage
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
    setBalanceLoading(true);
    try {
      const res = await fetch(`${TESTNET}/accounts/${account.publicKey}`);
      if (!res.ok) {
        setAccount((a) => a ? { ...a, xlmBalance: "0", tmxnBalance: "—" } : a);
        setBalanceLoading(false);
        return;
      }
      const data = await res.json();
      let xlm = "0", tmxn = "—";
      let trust = false;
      for (const b of data.balances) {
        if (b.asset_type === "native") xlm = parseFloat(b.balance).toFixed(2);
        if (b.asset_code === ASSET_CODE && b.asset_issuer === ISSUER) {
          tmxn = parseFloat(b.balance).toFixed(2);
          trust = true;
        }
      }
      setHasTrustline(trust);
      setAccount((a) => a ? { ...a, xlmBalance: xlm, tmxnBalance: tmxn } : a);
    } catch {
      setAccount((a) => a ? { ...a, xlmBalance: "Error" } : a);
    }
    setBalanceLoading(false);
  }, [account?.publicKey, ASSET_CODE, ISSUER]);

  useEffect(() => {
    if (account?.publicKey) loadBalances();
  }, [account?.publicKey]);

  function notify(message: string, isError = false) {
    if (isError) { setErr(message); setMsg(""); }
    else { setMsg(message); setErr(""); }
    setTimeout(() => { setMsg(""); setErr(""); }, 6000);
  }

  async function handleFaucet() {
    if (!account) return;
    setLoading((l) => ({ ...l, faucet: true }));
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: account.publicKey }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error, true); return; }
      notify("✓ Cuenta fondeada con 10,000 XLM en testnet");
      await loadBalances();
    } catch (e: unknown) { notify((e as Error).message, true); }
    finally { setLoading((l) => ({ ...l, faucet: false })); }
  }

  async function handleTrustline() {
    if (!account || !ISSUER) return;
    setLoading((l) => ({ ...l, trust: true }));
    try {
      const kp = Keypair.fromSecret(account.secretKey);
      const accRes = await fetch(`${TESTNET}/accounts/${account.publicKey}`);
      if (!accRes.ok) { notify("Fondea la cuenta primero con el faucet", true); return; }
      const accData = await accRes.json();
      const stellarAccount = new Account(accData.id, accData.sequence);
      const asset = new Asset(ASSET_CODE, ISSUER);
      const tx = new TransactionBuilder(stellarAccount, {
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
      if (!res.ok) { notify(result.detail ?? "Error al agregar trustline", true); return; }
      notify(`✓ Trustline de ${ASSET_CODE} agregada — ya puedes recibir tokens`);
      setHasTrustline(true);
      await loadBalances();
    } catch (e: unknown) { notify((e as Error).message, true); }
    finally { setLoading((l) => ({ ...l, trust: false })); }
  }

  async function handleLogin() {
    if (!account) return;
    setLoading((l) => ({ ...l, login: true }));
    try {
      const kp = Keypair.fromSecret(account.secretKey);
      const chRes = await fetch(`/auth?account=${account.publicKey}`);
      const ch = await chRes.json();
      if (!chRes.ok) { notify(ch.error, true); return; }
      const tx = TransactionBuilder.fromXDR(ch.transaction, ch.network_passphrase);
      tx.sign(kp);
      const signed = tx.toEnvelope().toXDR("base64");
      const authRes = await fetch("/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction: signed, network_passphrase: ch.network_passphrase }),
      });
      const authData = await authRes.json();
      if (!authRes.ok) { notify(authData.error, true); return; }
      setJwt(authData.token);
      notify("✓ Sesión SEP-10 activa — puedes iniciar operaciones");
      await loadTxs(authData.token);
    } catch (e: unknown) { notify((e as Error).message, true); }
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
    if (!APP_URL || !jwt) return;
    const url = `${APP_URL}/sep24/transactions/${kind}/interactive`;
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
          notify(data.error ?? "No se recibió URL de la operación", true);
        }
      })
      .catch((e: Error) => notify(e.message, true));
  }

  // Determinar estado de los pasos
  const isFunded = account?.xlmBalance && account.xlmBalance !== "0" && account.xlmBalance !== "Error";
  const stepState = {
    fund:    isFunded ? "done" : "active",
    trust:   !isFunded ? "" : hasTrustline ? "done" : "active",
    auth:    !hasTrustline ? "" : jwt ? "done" : "active",
    operate: !jwt ? "" : "active",
  };

  const shortKey = account
    ? `${account.publicKey.slice(0, 6)}···${account.publicKey.slice(-4)}`
    : "···";

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <span className={styles.navSymbol}>⟴</span>
          SEPuente
        </Link>
        <span className={styles.navBadge}>Testnet</span>
        <div className={styles.navLinks}>
          <a href="/devs" className={styles.navLink}>Docs</a>
          <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
          <a href="/pitch.html" className={styles.navLink}>Pitch →</a>
        </div>
      </nav>

      {/* Notice */}
      <div className={styles.notice}>
        <strong>Cliente de ejemplo</strong> — el protocolo SEPuente corre en{" "}
        <strong>sepuente.vercel.app</strong> y cualquier wallet compatible puede conectarse.{" "}
        <a href="/devs">Docs para devs →</a>
      </div>

      <main className={styles.main}>
        {/* Steps progress */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${stepState.fund ? styles[stepState.fund] : ""}`}>
            <div className={styles.stepDot}>{stepState.fund === "done" ? "✓" : "1"}</div>
            <span className={styles.stepLabel}>Fondear</span>
          </div>
          <div className={`${styles.step} ${stepState.trust ? styles[stepState.trust] : ""}`}>
            <div className={styles.stepDot}>{stepState.trust === "done" ? "✓" : "2"}</div>
            <span className={styles.stepLabel}>Trustline</span>
          </div>
          <div className={`${styles.step} ${stepState.auth ? styles[stepState.auth] : ""}`}>
            <div className={styles.stepDot}>{stepState.auth === "done" ? "✓" : "3"}</div>
            <span className={styles.stepLabel}>Autenticar</span>
          </div>
          <div className={`${styles.step} ${stepState.operate ? styles[stepState.operate] : ""}`}>
            <div className={styles.stepDot}>4</div>
            <span className={styles.stepLabel}>Operar</span>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Wallet card */}
          <div className={styles.walletCard}>
            <div className={styles.cardChip}>
              <span /><span /><span /><span />
            </div>
            <div className={styles.cardTitle}>Clave pública</div>
            <div className={styles.cardKey}>{shortKey}</div>

            <div className={styles.balances}>
              <div className={styles.balanceItem}>
                <div className={styles.balanceLabel}>XLM</div>
                <div className={`${styles.balanceValue} ${balanceLoading ? styles.loading : ""}`}>
                  {balanceLoading ? "      " : (account?.xlmBalance ?? "—")}
                </div>
              </div>
              <div className={styles.balanceItem}>
                <div className={styles.balanceLabel}>{ASSET_CODE}</div>
                <div className={`${styles.balanceValue} ${balanceLoading ? styles.loading : ""}`}>
                  {balanceLoading ? "      " : (account?.tmxnBalance ?? "—")}
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.btnGhost}
                onClick={handleFaucet}
                disabled={!!loading.faucet || !!isFunded}
              >
                {loading.faucet ? <span className={styles.spinner} /> : "🪙"}
                {loading.faucet ? "Fondeando…" : isFunded ? "XLM fondeado" : "Faucet XLM"}
              </button>
              {!hasTrustline && (
                <button
                  className={`${styles.btnGhost} ${styles.btnGhostGreen}`}
                  onClick={handleTrustline}
                  disabled={!!loading.trust || !isFunded}
                >
                  {loading.trust ? <span className={styles.spinner} /> : "+"}
                  {loading.trust ? "Agregando…" : `Trustline ${ASSET_CODE}`}
                </button>
              )}
            </div>
          </div>

          {/* Session card */}
          <div className={styles.sessionCard}>
            <div className={styles.sessionTitle}>Sesión SEP-10</div>
            <div className={styles.sessionStatus}>
              <span className={`${styles.statusDot} ${jwt ? styles.active : styles.inactive}`} />
              <span className={`${styles.statusText} ${jwt ? styles.authenticated : ""}`}>
                {jwt
                  ? "Autenticado — sesión activa"
                  : hasTrustline
                  ? "Listo para autenticar con SEP-10"
                  : isFunded
                  ? "Agrega la trustline para continuar"
                  : "Fondea la cuenta con el faucet primero"}
              </span>
            </div>

            {jwt && (
              <div className={styles.sessionToken}>
                JWT: {jwt.slice(0, 32)}…
              </div>
            )}

            {!jwt ? (
              <button
                className={styles.btnPrimary}
                onClick={handleLogin}
                disabled={!!loading.login || !hasTrustline}
              >
                {loading.login ? <><span className={styles.spinner} /> Autenticando…</> : "Iniciar sesión (SEP-10)"}
              </button>
            ) : (
              <button
                className={styles.btnPrimary}
                style={{ background: "rgba(47,191,113,0.15)", color: "#4CD68E", boxShadow: "none" }}
                disabled
              >
                ✓ Sesión activa
              </button>
            )}
          </div>
        </div>

        {/* Operations */}
        <div className={styles.opsCard}>
          <div className={styles.opsTitle}>Operaciones SEP-24</div>

          {jwt ? (
            <>
              <div className={styles.opsBtns}>
                <button className={styles.opBtn} onClick={() => openInteractive("deposit")}>
                  <div className={`${styles.opBtnIcon} ${styles.deposit}`}>⬇</div>
                  <div className={styles.opBtnLabel}>Depositar</div>
                  <div className={styles.opBtnSub}>SPEI → {ASSET_CODE}</div>
                </button>
                <button className={styles.opBtn} onClick={() => openInteractive("withdraw")}>
                  <div className={`${styles.opBtnIcon} ${styles.withdraw}`}>⬆</div>
                  <div className={styles.opBtnLabel}>Retirar</div>
                  <div className={styles.opBtnSub}>{ASSET_CODE} → SPEI</div>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.opsLocked}>
              <div className={styles.opsLockIcon}>🔒</div>
              <span>Completa los pasos anteriores para operar</span>
            </div>
          )}

          {msg && <div className={`${styles.toast} ${styles.toastSuccess}`}>{msg}</div>}
          {err && <div className={`${styles.toast} ${styles.toastError}`}>{err}</div>}
        </div>

        {/* Transaction history */}
        {jwt && (
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <span className={styles.historyTitle}>Historial de transacciones</span>
              <button className={styles.btnRefresh} onClick={() => loadTxs(jwt)}>
                ↻ Actualizar
              </button>
            </div>

            {txs.length === 0 ? (
              <div className={styles.emptyHistory}>
                Sin transacciones — inicia un depósito o retiro para comenzar
              </div>
            ) : (
              <table className={styles.txTable}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((tx) => {
                    const s = STATUS_STYLE[tx.status] ?? STATUS_STYLE.incomplete;
                    return (
                      <tr key={tx.id}>
                        <td>
                          <span className={`${styles.txKindBadge} ${tx.kind === "deposit" ? styles.deposit : styles.withdraw}`}>
                            {tx.kind === "deposit" ? "⬇ Depósito" : "⬆ Retiro"}
                          </span>
                        </td>
                        <td className={styles.txAmount}>
                          {tx.amount_out ?? tx.amount_in ?? "—"}{" "}
                          <span style={{ color: "#8B9BB5", fontWeight: 400, fontSize: "0.75rem" }}>
                            {tx.kind === "deposit" ? ASSET_CODE : "MXN"}
                          </span>
                        </td>
                        <td className={styles.txDate}>
                          {new Date(tx.started_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td>
                          <span
                            className={styles.txStatusBadge}
                            style={{ background: s.bg, color: s.color }}
                          >
                            {tx.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          {tx.stellar_transaction_id && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${tx.stellar_transaction_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.txLink}
                            >
                              ↗ Explorer
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <footer className={styles.footer}>
          <a href="/devs">Docs para devs</a>
          <span>·</span>
          <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer">GitHub</a>
          <span>·</span>
          <a href="/pitch.html">Pitch</a>
          <span>·</span>
          <span>Stellar Testnet</span>
        </footer>
      </main>
    </div>
  );
}
