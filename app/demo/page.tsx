"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Horizon,
} from "@stellar/stellar-sdk";
import styles from "./page.module.css";
import { SiteHeader, SiteFooter } from "../components/SiteHeader";
import { ui, Icon, Spinner, StatusBadge, SandboxNotice, CopyButton, EmptyState, useToasts } from "../components/ui";
import { fetchJson, errorText, horizonError } from "@/lib/client";
import { truncateMiddle, formatAmount, EXPLORER_TX, EXPLORER_ACCOUNT } from "@/lib/format";
import { PENDING_STATUSES } from "@/lib/status";
import { AnchorSheet, type SheetState } from "./AnchorSheet";
import { Glossary } from "../components/Glossary";
import { Logo3D } from "../components/brand/Logo3D";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Enter, Pressable, Swap } from "../components/motion";

const HORIZON = "https://horizon-testnet.stellar.org";
const ASSET_CODE = (process.env.NEXT_PUBLIC_ASSET_CODE ?? "TMXN").trim();
const ISSUER = (process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? "").trim();

interface Tx {
  id: string;
  kind: "deposit" | "withdrawal";
  status: string;
  amount_in?: string | null;
  amount_out?: string | null;
  started_at: string;
  stellar_transaction_id?: string | null;
}

interface Balances { xlm: string | null; tmxn: string | null; exists: boolean; trust: boolean }

type Busy = "faucet" | "trust" | "login" | "deposit" | "withdraw" | `pay:${string}` | null;

function jwtValid(token: string | null): token is string {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 60_000;
  } catch {
    return false;
  }
}

function store(key: string, value?: string | null) {
  try {
    if (value === undefined) return sessionStorage.getItem(key);
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch { /* almacenamiento bloqueado: la demo sigue funcionando en memoria */ }
  return null;
}

export default function DemoPage() {
  const toast = useToasts();
  const reduce = useReducedMotion();
  const [kp, setKp] = useState<Keypair | null>(null);
  const [bal, setBal] = useState<Balances | null>(null);
  const [balLoading, setBalLoading] = useState(true);
  const [jwt, setJwt] = useState("");
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const busyRef = useRef<Busy>(null);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const run = async (key: NonNullable<Busy>, fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = key;
    setBusy(key);
    try { await fn(); }
    catch (e) { toast.error((e as Error).message || "Algo salió mal. Intenta de nuevo."); }
    finally { busyRef.current = null; setBusy(null); }
  };

  useEffect(() => {
    let k: Keypair;
    const saved = store("sp_keypair");
    try { k = saved ? Keypair.fromSecret(saved) : Keypair.random(); }
    catch { k = Keypair.random(); }
    store("sp_keypair", k.secret());
    setKp(k);
    const savedJwt = store("sp_jwt");
    if (jwtValid(savedJwt)) setJwt(savedJwt);
  }, []);

  const loadBalances = useCallback(async () => {
    if (!kp) return;
    setBalLoading(true);
    try {
      const r = await fetchJson<{ balances: { asset_type: string; asset_code?: string; asset_issuer?: string; balance: string }[] }>(
        `${HORIZON}/accounts/${kp.publicKey()}`
      );
      if (r.status === 404) { setBal({ xlm: null, tmxn: null, exists: false, trust: false }); return; }
      if (!r.ok) throw new Error("No pudimos leer tu saldo en Horizon.");
      const native = r.data.balances.find((b) => b.asset_type === "native");
      const token = r.data.balances.find((b) => b.asset_code === ASSET_CODE && b.asset_issuer === ISSUER);
      setBal({ xlm: native?.balance ?? "0", tmxn: token?.balance ?? null, exists: true, trust: !!token });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBalLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kp]);

  const loadTxs = useCallback(async (token: string, quiet = false) => {
    if (!quiet) setTxLoading(true);
    try {
      const r = await fetchJson<{ transactions: Tx[] }>("/sep24/transactions", { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 403) {
        setJwt(""); store("sp_jwt", null);
        toast.error("Tu sesión SEP-10 expiró. Vuelve a iniciar sesión.");
        return;
      }
      if (!r.ok) throw new Error(errorText(r, "No pudimos cargar el historial"));
      const list = r.data.transactions ?? [];
      // Pull-on-read: consultar cada operación pendiente hace que el anchor detecte pagos en Stellar.
      const pending = list.filter((t) => PENDING_STATUSES.includes(t.status)).slice(0, 5);
      if (pending.length) {
        const fresh = await Promise.all(
          pending.map((t) =>
            fetchJson<{ transaction: Tx }>(`/sep24/transaction?id=${t.id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then((x) => (x.ok ? x.data.transaction : null))
              .catch(() => null)
          )
        );
        for (const f of fresh) {
          if (!f) continue;
          const i = list.findIndex((t) => t.id === f.id);
          if (i >= 0) {
            if (list[i].status !== "completed" && f.status === "completed") {
              toast.success(f.kind === "deposit" ? `Depósito acreditado en tu wallet.` : `Retiro completado.`);
              loadBalances();
            }
            list[i] = {
              ...list[i],
              status: f.status,
              amount_in: f.amount_in ?? list[i].amount_in,
              amount_out: f.amount_out ?? list[i].amount_out,
              stellar_transaction_id: f.stellar_transaction_id ?? list[i].stellar_transaction_id,
            };
          }
        }
      }
      setTxs(list);
      setTxError("");
    } catch (e) {
      if (!quiet) setTxError((e as Error).message);
      setTxs((prev) => prev ?? []);
    } finally {
      if (!quiet) setTxLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBalances]);

  useEffect(() => { if (kp) loadBalances(); }, [kp, loadBalances]);
  useEffect(() => { if (jwt) loadTxs(jwt); }, [jwt, loadTxs]);

  // Al volver de la pestaña/ventana del anchor, refresca estado y saldos.
  useEffect(() => {
    if (!jwt) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") { loadTxs(jwt, true); loadBalances(); }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [jwt, loadTxs, loadBalances]);

  // Mientras haya operaciones en curso, sondea cada 6 s.
  const hasPending = !!txs?.some((t) => PENDING_STATUSES.includes(t.status));
  useEffect(() => {
    if (!jwt || !hasPending) return;
    const iv = setInterval(() => loadTxs(jwt, true), 6000);
    return () => clearInterval(iv);
  }, [jwt, hasPending, loadTxs]);

  const handleFaucet = () => run("faucet", async () => {
    if (!kp) return;
    const r = await fetchJson("/api/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: kp.publicKey() }),
    }, 30000);
    if (!r.ok) throw new Error(errorText(r, "El faucet no respondió"));
    toast.success("Cuenta fondeada con 10,000 XLM de testnet.");
    await loadBalances();
  });

  async function submit(tx: ReturnType<TransactionBuilder["build"]>, fallback: string) {
    const r = await fetchJson<{ hash: string }>(`${HORIZON}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `tx=${encodeURIComponent(tx.toEnvelope().toXDR("base64"))}`,
    }, 45000);
    if (!r.ok) throw new Error(horizonError(r.data as never, fallback));
    return r.data.hash;
  }

  const handleTrustline = () => run("trust", async () => {
    if (!kp) return;
    if (!ISSUER) throw new Error("La demo no tiene configurado el emisor del token.");
    const account = await new Horizon.Server(HORIZON).loadAccount(kp.publicKey()).catch(() => {
      throw new Error("Tu cuenta aún no existe en testnet. Usa primero el faucet.");
    });
    const tx = new TransactionBuilder(account, { fee: "100000", networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.changeTrust({ asset: new Asset(ASSET_CODE, ISSUER) }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    await submit(tx, "No se pudo agregar la trustline.");
    toast.success(`Trustline de ${ASSET_CODE} lista.`);
    await loadBalances();
  });

  const handleLogin = () => run("login", async () => {
    if (!kp) return;
    const ch = await fetchJson<{ transaction: string; network_passphrase: string }>(`/auth?account=${kp.publicKey()}`);
    if (!ch.ok) throw new Error(errorText(ch, "No se pudo obtener el challenge SEP-10"));
    const tx = TransactionBuilder.fromXDR(ch.data.transaction, ch.data.network_passphrase);
    tx.sign(kp);
    const auth = await fetchJson<{ token: string }>("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: tx.toEnvelope().toXDR("base64"), network_passphrase: ch.data.network_passphrase }),
    });
    if (!auth.ok || !auth.data.token) throw new Error(errorText(auth, "El anchor rechazó la firma"));
    setJwt(auth.data.token);
    store("sp_jwt", auth.data.token);
    toast.success("Sesión SEP-10 iniciada.");
  });

  const openInteractive = (kind: "deposit" | "withdraw") => {
    if (busyRef.current || !jwt) return;
    run(kind, async () => {
      const r = await fetchJson<{ url: string; id: string }>(`/sep24/transactions/${kind}/interactive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ asset_code: ASSET_CODE }),
      });
      if (!r.ok || !r.data.url) {
        if (r.status === 403) { setJwt(""); store("sp_jwt", null); }
        throw new Error(errorText(r, "El anchor no devolvió la URL interactiva"));
      }
      // Misma origin: ruta relativa para que funcione también en previews y localhost.
      const u = new URL(r.data.url);
      setSheet({ url: `/sep24/interactive${u.search}&embed=1`, kind, id: r.data.id });
      loadTxs(jwt, true);
    });
  };

  const closeSheet = useCallback(() => {
    setSheet(null);
    if (jwt) { loadTxs(jwt, true); loadBalances(); }
  }, [jwt, loadTxs, loadBalances]);

  const payWithdrawal = (tx: Tx) => run(`pay:${tx.id}`, () => payWithdrawalCore(tx.id));

  async function payWithdrawalCore(txId: string) {
    if (!kp) throw new Error("La wallet aún no está lista.");
    const info = await fetchJson<{ transaction: { withdraw_anchor_account: string | null; withdraw_memo: string | null; withdraw_memo_type: string | null; amount_in: string | null } }>(
      `/sep24/transaction?id=${txId}`, { headers: { Authorization: `Bearer ${jwt}` } }
    );
    if (!info.ok) throw new Error(errorText(info, "No pudimos leer el retiro"));
    const { withdraw_anchor_account: dest, withdraw_memo: memo, withdraw_memo_type: memoType, amount_in } = info.data.transaction;
    if (!dest || !memo || !amount_in) throw new Error("Este retiro aún no tiene instrucciones de pago.");
    const amount = parseFloat(amount_in).toFixed(7);
    if (bal?.tmxn != null && parseFloat(bal.tmxn) < parseFloat(amount)) {
      throw new Error(`Necesitas ${formatAmount(amount)} ${ASSET_CODE} y tienes ${formatAmount(bal.tmxn)}.`);
    }
    const account = await new Horizon.Server(HORIZON).loadAccount(kp.publicKey());
    const built = new TransactionBuilder(account, { fee: "100000", networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.payment({ destination: dest, asset: new Asset(ASSET_CODE, ISSUER), amount }))
      .addMemo(memoType === "id" ? Memo.id(memo) : memoType === "hash" ? Memo.hash(memo) : Memo.text(memo))
      .setTimeout(60)
      .build();
    built.sign(kp);
    await submit(built, "No se pudo enviar el pago del retiro.");
    toast.success(`Enviaste ${formatAmount(amount)} ${ASSET_CODE} al anchor. Confirmando…`);
    await loadBalances();
    await loadTxs(jwt, true);
  }

  // Mensajes de la pantalla del anchor incrustada. Solo se aceptan de la misma origin y del iframe abierto.
  const payRef = useRef(payWithdrawalCore);
  payRef.current = payWithdrawalCore;
  useEffect(() => {
    if (!sheet) return;
    const onMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return;
      const msg = e.data as { type?: string };
      if (msg?.type === "sepuente:close") closeSheet();
      if (msg?.type === "sepuente:status") { loadTxs(jwt, true); loadBalances(); }
      if (msg?.type === "sepuente:pay_request") {
        const reply = (data: Record<string, unknown>) => iframeRef.current?.contentWindow?.postMessage({ type: "sepuente:pay_result", ...data }, window.location.origin);
        if (busyRef.current) { reply({ ok: false, error: "La wallet está ocupada, intenta en un momento." }); return; }
        busyRef.current = `pay:${sheet.id}`;
        setBusy(`pay:${sheet.id}`);
        try {
          await payRef.current(sheet.id);
          reply({ ok: true });
        } catch (err) {
          reply({ ok: false, error: (err as Error).message || "No se pudo enviar el pago." });
        } finally {
          busyRef.current = null;
          setBusy(null);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sheet, jwt, closeSheet, loadTxs, loadBalances]);

  const logout = () => { setJwt(""); store("sp_jwt", null); setTxs(null); };

  const funded = !!bal?.exists;
  const trusted = !!bal?.trust;
  const step = jwt ? 4 : trusted ? 3 : funded ? 2 : 1;
  const pk = kp?.publicKey() ?? "";

  const steps = [
    {
      n: 1, title: "Obtén saldo de prueba", tag: "Faucet · XLM", desc: "Stellar cobra centavos por cada movimiento; te regalamos XLM de prueba para cubrirlos.",
      done: funded, action: handleFaucet, cta: "Obtener saldo de prueba", busyLabel: "Fondeando…", key: "faucet" as const,
    },
    {
      n: 2, title: "Activa los pesos digitales", tag: `Trustline ${ASSET_CODE}`, desc: `Das permiso a tu wallet para recibir ${ASSET_CODE} (1 ${ASSET_CODE} = 1 peso). Se hace una sola vez.`,
      done: trusted, action: handleTrustline, cta: "Activar pesos digitales", busyLabel: "Firmando…", key: "trust" as const,
    },
    {
      n: 3, title: "Conéctate al anchor", tag: "SEP-10", desc: "Tu wallet firma un mensaje para demostrar que es tuya. Sin contraseñas ni registro.",
      done: !!jwt, action: handleLogin, cta: "Conectar mi wallet", busyLabel: "Autenticando…", key: "login" as const,
    },
  ];

  return (
    <div className={styles.page}>
      <SiteHeader badge="Testnet" />

      <main id="main" className={styles.main}>
        <Enter as="section" className={styles.intro}>
          <div className={styles.introBrand}>
            <Logo3D />
          </div>
          <div className={styles.introText}>
            <p className={ui.eyebrow}>Wallet de prueba · SEP-24</p>
            <h1 className={styles.title}>Prueba el puente en 2 minutos</h1>
            <p className={styles.lead}>
              Esta página es una wallet de prueba: crea una cuenta en tu navegador para que deposites y retires pesos digitales con SEPuente, sin instalar nada.
            </p>
          </div>
          <div className={styles.introNotes}>
            <SandboxNotice>
              Stellar testnet: los XLM y {ASSET_CODE} no tienen valor. El SPEI es simulado; no envíes dinero real.
            </SandboxNotice>
            <Glossary compact />
          </div>
        </Enter>

        <div className={styles.grid}>
          {/* ── Wallet ── */}
          <Enter as="section" delay={0.08} className={`${ui.card} ${styles.wallet}`} aria-labelledby="wallet-title">
            <div className={styles.walletHead}>
              <h2 id="wallet-title" className={ui.cardTitle}>Tu wallet</h2>
              <button type="button" className={`${ui.btn} ${ui.ghost} ${ui.btnSm}`} onClick={loadBalances} disabled={balLoading} aria-label="Actualizar saldos">
                {balLoading ? <Spinner /> : Icon.refresh(16)}
                <span className={styles.hideXs}>Actualizar</span>
              </button>
            </div>

            <div className={styles.addrRow}>
              <div className={styles.addrBlock}>
                <span className={styles.addrLabel}>Dirección pública</span>
                <a
                  className={`addr ${styles.addr}`}
                  href={pk ? `${EXPLORER_ACCOUNT}${pk}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  title={pk}
                >
                  {pk ? truncateMiddle(pk, 8, 8) : "Generando…"}
                </a>
              </div>
              {pk && <CopyButton value={pk} label="Dirección" />}
            </div>

            <div className={styles.balances}>
              <div className={styles.balance}>
                <span className={styles.balLabel}>XLM</span>
                <span className={styles.balValue}>
                  {balLoading && !bal ? <span className={ui.skeleton} /> : <Swap k={bal?.exists ? bal.xlm ?? "0" : "0"}>{bal?.exists ? formatAmount(bal.xlm) : "0.00"}</Swap>}
                </span>
              </div>
              <div className={styles.balance}>
                <span className={styles.balLabel}>{ASSET_CODE}</span>
                <span className={`${styles.balValue} ${styles.balGold}`}>
                  {balLoading && !bal ? <span className={ui.skeleton} /> : <Swap k={bal?.trust ? bal.tmxn ?? "0" : "none"}>{bal?.trust ? formatAmount(bal.tmxn) : "—"}</Swap>}
                </span>
              </div>
            </div>
            <p className={styles.keyNote}>La llave privada vive solo en esta pestaña (sessionStorage). SEPuente nunca la recibe.</p>
          </Enter>

          {/* ── Pasos ── */}
          <Enter as="section" delay={0.14} className={`${ui.card} ${styles.stepsCard}`} aria-labelledby="steps-title">
            <h2 id="steps-title" className={ui.cardTitle}>Prepárate en 3 pasos</h2>
            <ol className={styles.steps}>
              {steps.map((s) => {
                const active = step === s.n;
                const locked = step < s.n;
                return (
                  <li key={s.n} className={styles.step} data-state={s.done ? "done" : active ? "active" : "locked"}>
                    <span className={styles.stepNum} aria-hidden="true"><Swap k={s.done ? "done" : "n"} pop>{s.done ? Icon.check(14) : s.n}</Swap></span>
                    <div className={styles.stepBody}>
                      <span className={styles.stepTitle}>{s.title} <span className={styles.stepTag}>{s.tag}</span></span>
                      <span className={styles.stepDesc}>{s.desc}</span>
                      {active && !s.done && (
                        <Pressable
                          type="button"
                          className={`${ui.btn} ${ui.primary} ${styles.stepBtn}`}
                          onClick={s.action}
                          aria-busy={busy === s.key}
                          disabled={!!busy || !kp || (balLoading && !bal)}
                        >
                          {busy === s.key ? <><Spinner />{s.busyLabel}</> : s.cta}
                        </Pressable>
                      )}
                    </div>
                    <span className="sr-only">{s.done ? "Completado" : locked ? "Pendiente" : "Paso actual"}</span>
                  </li>
                );
              })}
            </ol>
            {jwt && (
              <Enter className={styles.session} y={8}>
                <span className={`${ui.badge} ${ui["tone-success"]}`}>Sesión SEP-10 activa</span>
                <button type="button" className={ui.linkBtn} onClick={logout}>Cerrar sesión</button>
              </Enter>
            )}
          </Enter>
        </div>

        {/* ── Operaciones ── */}
        <section className={styles.ops} aria-labelledby="ops-title">
          <div className={styles.sectionHead}>
            <h2 id="ops-title" className={styles.h2}>Operar</h2>
            {!jwt && <span className={styles.lockHint}>Completa los 3 pasos para desbloquear</span>}
          </div>
          <div className={styles.opsGrid}>
            <Pressable type="button" className={`${styles.op} ${styles.opDeposit}`} onClick={() => openInteractive("deposit")} disabled={!jwt || !!busy}>
              <span className={styles.opIcon}>{busy === "deposit" ? <Spinner /> : Icon.down(22)}</span>
              <span className={styles.opText}>
                <span className={styles.opTitle}>Depositar</span>
                <span className={styles.opDesc}>Pesos de tu banco (SPEI simulado) → pesos digitales en tu wallet</span>
              </span>
              <span className={styles.opArrow}>{Icon.arrow(18)}</span>
            </Pressable>
            <Pressable type="button" className={`${styles.op} ${styles.opWithdraw}`} onClick={() => openInteractive("withdraw")} disabled={!jwt || !!busy}>
              <span className={styles.opIcon}>{busy === "withdraw" ? <Spinner /> : Icon.up(22)}</span>
              <span className={styles.opText}>
                <span className={styles.opTitle}>Retirar</span>
                <span className={styles.opDesc}>Pesos digitales de tu wallet → pesos a tu cuenta bancaria (simulado)</span>
              </span>
              <span className={styles.opArrow}>{Icon.arrow(18)}</span>
            </Pressable>
          </div>
        </section>

        {/* ── Historial ── */}
        {jwt && (
          <section className={`${ui.card} ${styles.history}`} aria-labelledby="hist-title">
            <div className={styles.walletHead}>
              <h2 id="hist-title" className={ui.cardTitle}>Historial</h2>
              <button type="button" className={`${ui.btn} ${ui.ghost} ${ui.btnSm}`} onClick={() => loadTxs(jwt)} disabled={txLoading} aria-label="Actualizar historial">
                {txLoading ? <Spinner /> : Icon.refresh(16)}
                <span className={styles.hideXs}>Actualizar</span>
              </button>
            </div>

            {txError && (
              <div className={ui.alert} role="alert">
                {Icon.alert(16)}
                <span>{txError} <button type="button" className={ui.linkBtn} onClick={() => loadTxs(jwt)}>Reintentar</button></span>
              </div>
            )}
            {txs === null ? (
              <ul className={styles.txList} aria-busy="true">
                {[0, 1].map((i) => (
                  <li key={i} className={styles.txRow}>
                    <span className={`${ui.skeleton} ${styles.skelIcon}`} />
                    <span className={styles.txMain}><span className={ui.skeleton} style={{ width: "60%" }} /><span className={ui.skeleton} style={{ width: "40%" }} /></span>
                  </li>
                ))}
              </ul>
            ) : txs.length === 0 ? (
              txError ? null : <EmptyState title="Aún no hay operaciones" text="Cuando deposites o retires, verás aquí cada movimiento con su estado en tiempo real." />
            ) : (
              <ul className={styles.txList}>
                <AnimatePresence initial={false}>
                {txs.map((tx) => {
                  const isDep = tx.kind === "deposit";
                  const amount = tx.amount_out ?? tx.amount_in;
                  const unit = tx.amount_out ? (isDep ? ASSET_CODE : "MXN") : (isDep ? "MXN" : ASSET_CODE);
                  const needsPay = !isDep && tx.status === "pending_user_transfer_start";
                  return (
                    <motion.li
                      key={tx.id}
                      layout={reduce ? false : "position"}
                      className={styles.txRow}
                      initial={reduce ? false : { opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    >
                      <span className={`${styles.txIcon} ${isDep ? styles.txDep : styles.txWd}`} aria-hidden="true">
                        {isDep ? Icon.down(16) : Icon.up(16)}
                      </span>
                      <div className={styles.txMain}>
                        <div className={styles.txTop}>
                          <span className={styles.txKind}>{isDep ? "Depósito" : "Retiro"}</span>
                          <span className={styles.txAmt}>{amount ? `${formatAmount(amount)} ${unit}` : "—"}</span>
                        </div>
                        <div className={styles.txBottom}>
                          <Swap k={tx.status}><StatusBadge status={tx.status} /></Swap>
                          <time className={styles.txDate} dateTime={tx.started_at}>
                            {new Date(tx.started_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                          </time>
                        </div>
                        {needsPay && (
                          <button
                            type="button"
                            className={`${ui.btn} ${ui.primary} ${ui.btnSm} ${styles.payBtn}`}
                            onClick={() => payWithdrawal(tx)}
                            aria-busy={busy === `pay:${tx.id}`}
                            disabled={!!busy}
                          >
                            {busy === `pay:${tx.id}` ? <><Spinner />Enviando…</> : <>Enviar {tx.amount_in ? formatAmount(tx.amount_in) : ""} {ASSET_CODE} al anchor</>}
                          </button>
                        )}
                        {tx.stellar_transaction_id && (
                          <a className={ui.extLink} href={`${EXPLORER_TX}${tx.stellar_transaction_id}`} target="_blank" rel="noreferrer">
                            <span className="addr">{truncateMiddle(tx.stellar_transaction_id, 6, 6)}</span>
                            {Icon.external(14)}
                            <span className="sr-only">Ver en stellar.expert</span>
                          </a>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
                </AnimatePresence>
              </ul>
            )}
          </section>
        )}
      </main>

      <SiteFooter />
      <AnchorSheet sheet={sheet} onClose={closeSheet} iframeRef={iframeRef} />
      {toast.view}
    </div>
  );
}
