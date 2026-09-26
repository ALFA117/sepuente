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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  incomplete:                  { bg: "rgba(139,155,181,0.1)",  color: "#8B9BB5",  label: "Incompleto" },
  pending_user_transfer_start: { bg: "rgba(212,168,67,0.15)",  color: "#D4A843",  label: "En proceso" },
  pending_anchor:              { bg: "rgba(79,158,248,0.15)",   color: "#7DBAFF",  label: "Procesando" },
  completed:                   { bg: "rgba(47,191,113,0.15)",   color: "#4CD68E",  label: "Completado" },
  error:                       { bg: "rgba(224,82,82,0.12)",    color: "#F07070",  label: "Error" },
  expired:                     { bg: "rgba(224,82,82,0.12)",    color: "#F07070",  label: "Expirado" },
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
      setAccount((a) => a ? { ...a, xlmBalance: "—" } : a);
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
      notify("Cuenta fondeada con 10,000 XLM en testnet");
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
      notify(`Trustline de ${ASSET_CODE} lista`);
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
      notify("Sesión SEP-10 activa");
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
    } catch { }
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
          notify(data.error ?? "No se recibió URL", true);
        }
      })
      .catch((e: Error) => notify(e.message, true));
  }

  const isFunded = !!(account?.xlmBalance && account.xlmBalance !== "0" && account.xlmBalance !== "—");
  const currentStep = jwt ? 4 : hasTrustline ? 3 : isFunded ? 2 : 1;
  const shortKey = account
    ? `${account.publicKey.slice(0, 6)} ··· ${account.publicKey.slice(-6)}`
    : "···";

  return (
    <div className={styles.page}>

      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          <span className={styles.navSym}>⟴</span>
          SEPuente
        </Link>
        <div className={styles.navPill}>
          <span className={styles.navPillDot} />
          Stellar Testnet · SEP-24
        </div>
        <div className={styles.navRight}>
          <a href="/devs" className={styles.navLink}>Docs</a>
          <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Wallet Demo — Flujo SEP-24 completo
          </div>
          <h1 className={styles.heroTitle}>
            De pesos a Stellar<br />
            <span className={styles.heroAccent}>sin intermediarios</span>
          </h1>
          <p className={styles.heroSub}>
            Conecta, firma y opera con el anchor SEP-24 no custodial para el peso mexicano.
          </p>
        </div>
      </section>

      <main className={styles.main}>

        <div className={styles.stepsRow}>
          {[
            { n: 1, label: "Fondear",    sub: "Faucet XLM" },
            { n: 2, label: "Trustline",  sub: ASSET_CODE },
            { n: 3, label: "Autenticar", sub: "SEP-10" },
            { n: 4, label: "Operar",     sub: "SEP-24" },
          ].map((s, i, arr) => {
            const done = currentStep > s.n;
            const active = currentStep === s.n;
            return (
              <div key={s.n} className={styles.stepItem}>
                <div className={`${styles.stepBubble} ${done ? styles.sDone : active ? styles.sActive : styles.sIdle}`}>
                  {done
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    : <span>{s.n}</span>
                  }
                </div>
                <div className={styles.stepTexts}>
                  <span className={`${styles.stepLbl} ${done ? styles.sLblDone : active ? styles.sLblActive : styles.sLblIdle}`}>{s.label}</span>
                  <span className={styles.stepSub}>{s.sub}</span>
                </div>
                {i < arr.length - 1 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ""}`} />}
              </div>
            );
          })}
        </div>

        <div className={styles.twoCol}>

          <div className={styles.walletCard}>
            <div className={styles.cardShine} />
            <div className={styles.cardTop}>
              <span className={styles.cardLogo}>⟴</span>
              <div className={styles.cardChipGrid}>
                <div /><div /><div /><div />
              </div>
            </div>
            <div className={styles.cardNetRow}>
              <span className={styles.cardNetDot} />
              Stellar Testnet
            </div>
            <div className={styles.cardKey} title={account?.publicKey}>{shortKey}</div>
            <div className={styles.cardBalances}>
              <div className={styles.cardBal}>
                <span className={styles.cardBalLabel}>XLM</span>
                <span className={`${styles.cardBalVal} ${balanceLoading ? styles.skel : ""}`}>
                  {balanceLoading ? "" : (account?.xlmBalance ?? "—")}
                </span>
              </div>
              <div className={styles.cardBalDivider} />
              <div className={styles.cardBal}>
                <span className={styles.cardBalLabel}>{ASSET_CODE}</span>
                <span className={`${styles.cardBalVal} ${balanceLoading ? styles.skel : ""}`}>
                  {balanceLoading ? "" : (account?.tmxnBalance ?? "—")}
                </span>
              </div>
            </div>
            <div className={styles.cardBtns}>
              <button
                className={`${styles.cBtn} ${isFunded ? styles.cBtnGreenDone : styles.cBtnGold}`}
                onClick={handleFaucet}
                disabled={!!loading.faucet || isFunded}
              >
                {loading.faucet ? <span className={styles.spin} /> : isFunded ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> : null}
                {isFunded ? "Fondeado" : loading.faucet ? "Fondeando..." : "Faucet XLM"}
              </button>
              <button
                className={`${styles.cBtn} ${hasTrustline ? styles.cBtnBlueDone : styles.cBtnBlue}`}
                onClick={handleTrustline}
                disabled={!!loading.trust || !isFunded || hasTrustline}
              >
                {loading.trust ? <span className={styles.spinBlue} /> : hasTrustline ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> : null}
                {hasTrustline ? `Trust ${ASSET_CODE}` : loading.trust ? "Procesando..." : `+ Trust ${ASSET_CODE}`}
              </button>
            </div>
          </div>

          <div className={styles.authCard}>
            <div className={styles.authTop}>
              <div className={styles.authIconBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className={styles.authTitles}>
                <div className={styles.authTitle}>Autenticación SEP-10</div>
                <div className={styles.authSubtitle}>Web Auth · Stellar</div>
              </div>
              <div className={`${styles.authPill} ${jwt ? styles.authPillOn : styles.authPillOff}`}>
                <span className={`${styles.authPillDot} ${jwt ? styles.authPillDotOn : ""}`} />
                {jwt ? "Activa" : "Sin sesión"}
              </div>
            </div>

            <div className={styles.authMid}>
              {jwt ? (
                <div className={styles.jwtBlock}>
                  <span className={styles.jwtLabel}>JWT</span>
                  <span className={styles.jwtVal}>{jwt.slice(0, 36)}...</span>
                </div>
              ) : (
                <p className={styles.authHint}>
                  {hasTrustline
                    ? "Tu cuenta está lista. Firma el challenge criptográfico para obtener acceso al protocolo."
                    : isFunded
                    ? "Agrega la trustline del token TMXN antes de autenticarte."
                    : "Fondea la cuenta con XLM para comenzar."}
                </p>
              )}
            </div>

            <div className={styles.authBottom}>
              {!jwt ? (
                <button className={styles.authBtn} onClick={handleLogin} disabled={!!loading.login || !hasTrustline}>
                  {loading.login
                    ? <><span className={styles.spin} />Autenticando...</>
                    : <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                        </svg>
                        Iniciar sesión SEP-10
                      </>
                  }
                </button>
              ) : (
                <div className={styles.authSuccess}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  Sesión autenticada · SEP-10
                </div>
              )}
            </div>
          </div>
        </div>

        <section className={styles.opsSection}>
          {jwt ? (
            <>
              <div className={styles.opsSectionHead}>
                <span className={styles.opsSectionTitle}>Operaciones SEP-24</span>
                <span className={styles.opsSectionSub}>{ASSET_CODE} · Stellar Testnet</span>
              </div>
              <div className={styles.opsGrid}>
                <button className={`${styles.opCard} ${styles.opDeposit}`} onClick={() => openInteractive("deposit")}>
                  <div className={styles.opGlow} />
                  <div className={styles.opIconWrap}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v13M5 14l7 7 7-7"/>
                    </svg>
                  </div>
                  <div className={styles.opBody}>
                    <div className={styles.opTitle}>Depositar</div>
                    <div className={styles.opDesc}>Transfiere pesos MXN vía SPEI y recibe {ASSET_CODE} en tu wallet Stellar al instante.</div>
                  </div>
                  <div className={styles.opRoute}>
                    <span>SPEI</span>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>{ASSET_CODE}</span>
                  </div>
                  <div className={styles.opArrow}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </button>

                <button className={`${styles.opCard} ${styles.opWithdraw}`} onClick={() => openInteractive("withdraw")}>
                  <div className={styles.opGlow} />
                  <div className={styles.opIconWrap}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21V8M5 10l7-7 7 7"/>
                    </svg>
                  </div>
                  <div className={styles.opBody}>
                    <div className={styles.opTitle}>Retirar</div>
                    <div className={styles.opDesc}>Quema {ASSET_CODE} en Stellar y recibe pesos MXN directamente en tu cuenta SPEI.</div>
                  </div>
                  <div className={styles.opRoute}>
                    <span>{ASSET_CODE}</span>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>SPEI</span>
                  </div>
                  <div className={styles.opArrow}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.opsLocked}>
              <div className={styles.opsLockedDecor} />
              <div className={styles.opsLockedContent}>
                <div className={styles.opsLockedIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div className={styles.opsLockedTitle}>Operaciones SEP-24</div>
                <div className={styles.opsLockedHint}>
                  {4 - currentStep + 1 === 1 ? "Un paso más" : `${4 - currentStep + 1} pasos restantes`} para depositar o retirar pesos
                </div>
                <div className={styles.opsLockedBtns}>
                  <div className={styles.opsGhostBtn}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13M5 14l7 7 7-7"/></svg>
                    Depositar
                  </div>
                  <div className={styles.opsGhostBtn}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V8M5 10l7-7 7 7"/></svg>
                    Retirar
                  </div>
                </div>
              </div>
            </div>
          )}

          {msg && (
            <div className={`${styles.toast} ${styles.toastOk}`} role="status" aria-live="polite">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              {msg}
            </div>
          )}
          {err && (
            <div className={`${styles.toast} ${styles.toastErr}`} role="alert" aria-live="assertive">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {err}
            </div>
          )}
        </section>

        {jwt && (
          <section className={styles.histSection}>
            <div className={styles.histHead}>
              <span className={styles.histTitle}>Historial</span>
              <button className={styles.histRefresh} onClick={() => loadTxs(jwt)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                Actualizar
              </button>
            </div>

            {txs.length === 0 ? (
              <div className={styles.histEmpty}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                </svg>
                <span>Sin transacciones — inicia un depósito o retiro</span>
              </div>
            ) : (
              <div className={styles.histList}>
                {txs.map((tx) => {
                  const s = STATUS_STYLE[tx.status] ?? STATUS_STYLE.incomplete;
                  return (
                    <div key={tx.id} className={styles.histRow}>
                      <div className={`${styles.histIcon} ${tx.kind === "deposit" ? styles.histD : styles.histW}`}>
                        {tx.kind === "deposit"
                          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13M5 14l7 7 7-7"/></svg>
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V8M5 10l7-7 7 7"/></svg>
                        }
                      </div>
                      <div className={styles.histInfo}>
                        <span className={styles.histKind}>{tx.kind === "deposit" ? "Depósito" : "Retiro"}</span>
                        <span className={styles.histDate}>{new Date(tx.started_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      <div className={styles.histAmt}>
                        {tx.amount_out ?? tx.amount_in ?? "—"}
                        <span className={styles.histCur}>{tx.kind === "deposit" ? ASSET_CODE : "MXN"}</span>
                      </div>
                      <div className={styles.histStatus} style={{ background: s.bg, color: s.color }}>{s.label}</div>
                      {tx.stellar_transaction_id
                        ? <a href={`https://stellar.expert/explorer/testnet/tx/${tx.stellar_transaction_id}`} target="_blank" rel="noreferrer" className={styles.histLink}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                          </a>
                        : <div />
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className={styles.protoBar}>
          {["SEP-1 stellar.toml", "SEP-10 Web Auth", "SEP-24 Hosted Transfers", "SEP-38 Anchor RFQ"].map((p) => (
            <div key={p} className={styles.protoChip}>{p}</div>
          ))}
        </div>

        <footer className={styles.footer}>
          <Link href="/" className={styles.footBrand}>⟴ SEPuente</Link>
          <div className={styles.footLinks}>
            <a href="/devs">Docs</a>
            <span>·</span>
            <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer">GitHub</a>
            <span>·</span>
            <a href="/pitch.html">Pitch</a>
          </div>
          <span className={styles.footMono}>Stellar Testnet</span>
        </footer>

      </main>
    </div>
  );
}
