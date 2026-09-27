"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import styles from "./page.module.css";
import { SiteHeader } from "../../components/SiteHeader";
import { ui, Icon, Spinner, StatusBadge, SandboxNotice, CopyButton } from "../../components/ui";
import { amountError, MIN_AMOUNT, MAX_AMOUNT } from "@/lib/amount";
import { clabeError } from "@/lib/clabe";
import { truncateMiddle, formatAmount, EXPLORER_TX } from "@/lib/format";

const ASSET = (process.env.NEXT_PUBLIC_ASSET_CODE ?? "TMXN").trim();
const DEMO_CLABE = "646180157000000004";

interface QuoteResult { sell_amount: string; buy_amount: string; price: string; fee: string; expires_at: string; sandbox?: boolean }
interface DepositInstructions { clabe: string; reference: string; bank_name: string; beneficiary: string; sandbox?: boolean }
interface WithdrawInstructions { anchor_account: string; anchor_memo: string; anchor_memo_type: string; sandbox?: boolean }
interface TxData {
  id: string; kind: string; status: string;
  amount_in?: string | null; amount_out?: string | null; amount_fee?: string | null; clabe?: string | null;
  stellar_transaction_id?: string | null; error_message?: string | null;
}

type Step = "loading" | "form" | "quote" | "instructions" | "done" | "fatal";
const STEPS: { key: Step; label: string }[] = [
  { key: "form", label: "Monto" },
  { key: "quote", label: "Cotización" },
  { key: "instructions", label: "Pago" },
  { key: "done", label: "Listo" },
];
const ORDER: Step[] = ["form", "quote", "instructions", "done"];

function InteractiveContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const isDeposit = (params.get("kind") ?? "deposit") !== "withdraw";

  const [step, setStep] = useState<Step>("loading");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  const [clabe, setClabe] = useState("");
  const [touched, setTouched] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [instr, setInstr] = useState<DepositInstructions | WithdrawInstructions | null>(null);
  const [tx, setTx] = useState<TxData | null>(null);
  const [sandbox, setSandbox] = useState(true);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [err, setErr] = useState("");
  const [fatal, setFatal] = useState("");
  const [pollFails, setPollFails] = useState(0);
  const firstField = useRef<HTMLInputElement>(null);
  const [embedded, setEmbedded] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  // Incrustada en la wallet (iframe de la misma origin): se comunica por postMessage en lugar de abrir ventanas.
  useEffect(() => {
    setEmbedded(params.get("embed") === "1" && window.self !== window.top);
  }, [params]);

  useEffect(() => {
    if (!embedded) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const msg = e.data as { type?: string; ok?: boolean; error?: string };
      if (msg?.type !== "sepuente:pay_result") return;
      setPaying(false);
      if (msg.ok) setPaid(true);
      else setErr(msg.error ?? "La wallet no pudo enviar el pago.");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedded]);

  useEffect(() => {
    if (embedded && tx?.status) {
      window.parent.postMessage({ type: "sepuente:status", status: tx.status }, window.location.origin);
    }
  }, [embedded, tx?.status]);

  const api = useCallback(async (body: Record<string, string>, timeoutMs = 25000) => {
    let res: Response;
    try {
      res = await fetch("/api/sep24", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, token }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      const name = (e as Error)?.name;
      throw new Error(name === "TimeoutError" ? "La red tardó demasiado. Revisa tu conexión e intenta de nuevo." : "Sin conexión con el anchor. Revisa tu red.");
    }
    const text = await res.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = {};
    try { data = text ? JSON.parse(text) : {}; } catch { /* respuesta no-JSON */ }
    if (!res.ok || data.error) {
      const e = new Error(data.error ?? `El anchor respondió ${res.status} sin detalle. Intenta de nuevo.`) as Error & { status?: number };
      e.status = res.status;
      throw e;
    }
    if (typeof data.sandbox === "boolean") setSandbox(data.sandbox);
    return data;
  }, [token]);

  // Restaura el estado si la pantalla se recarga a mitad del flujo.
  useEffect(() => {
    if (!token) { setFatal("Abre esta pantalla desde tu wallet: falta el token de sesión."); setStep("fatal"); return; }
    let cancelled = false;
    (async () => {
      try {
        const { transaction } = await api({ action: "status" });
        if (cancelled) return;
        setTx(transaction);
        if (transaction?.amount_in) setAmount(String(parseFloat(transaction.amount_in)));
        if (transaction?.status === "pending_user_transfer_start") {
          const data = await api({ action: isDeposit ? "start_deposit" : "start_withdraw" });
          if (!cancelled) { setInstr(data); setStep("instructions"); }
        } else if (["completed", "error", "expired", "refunded"].includes(transaction?.status)) {
          setStep("done");
        } else if (transaction?.status && transaction.status !== "incomplete") {
          setStep("instructions");
        } else {
          setStep("form");
        }
      } catch (e) {
        if (cancelled) return;
        setFatal((e as Error).message);
        setStep("fatal");
      }
    })();
    return () => { cancelled = true; };
  }, [api, isDeposit, token]);

  useEffect(() => {
    if (step === "form") firstField.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Sondeo mientras se esperan instrucciones de pago; se limpia al salir del paso.
  useEffect(() => {
    if (step !== "instructions") return;
    let stopped = false;
    const tick = async () => {
      try {
        const { transaction } = await api({ action: "status" }, 15000);
        if (stopped) return;
        setPollFails(0);
        setTx(transaction);
        if (["completed", "error", "expired", "refunded"].includes(transaction?.status)) setStep("done");
      } catch {
        if (!stopped) setPollFails((n) => n + 1);
      }
    };
    const iv = setInterval(tick, 4000);
    return () => { stopped = true; clearInterval(iv); };
  }, [step, api]);

  const amountErr = amountError(amount);
  const clabeErr = isDeposit ? null : clabeError(clabe);

  async function handleQuote(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setErr("");
    if (amountErr || clabeErr) return;
    setLoading(true);
    try {
      const q = await api(
        isDeposit
          ? { action: "quote", sell_amount: amount }
          : { action: "quote", sell_amount: amount, sell_asset: `stellar:${ASSET}`, buy_asset: "iso4217:MXN" }
      );
      setQuote(q);
      setStep("quote");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (loading) return;
    setErr("");
    if (quote && new Date(quote.expires_at).getTime() < Date.now()) {
      setErr("La cotización expiró. Vuelve y cotiza de nuevo.");
      return;
    }
    setLoading(true);
    try {
      const data = await api(isDeposit ? { action: "start_deposit", amount } : { action: "start_withdraw", amount, clabe });
      setInstr(data);
      setStep("instructions");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    if (simulating) return;
    setSimulating(true);
    setErr("");
    try {
      await api({ action: "simulate" }, 60000);
      const { transaction } = await api({ action: "status" });
      setTx(transaction);
      if (transaction?.status === "completed") setStep("done");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSimulating(false);
    }
  }

  function requestPayment() {
    if (!embedded || paying || paid) return;
    setErr("");
    setPaying(true);
    window.parent.postMessage({ type: "sepuente:pay_request" }, window.location.origin);
  }

  function backToWallet() {
    if (embedded) {
      window.parent.postMessage({ type: "sepuente:close" }, window.location.origin);
      return;
    }
    // Solo cerrar si somos un popup: si la wallet navegó en esta misma pestaña, cerrarla la perdería.
    if (window.opener && !window.opener.closed) {
      try { window.opener.focus(); } catch { /* otra origin */ }
      window.close();
      setTimeout(() => { if (!window.closed) window.location.href = "/demo"; }, 300);
    } else {
      window.location.href = "/demo";
    }
  }

  const cur = step === "done" && tx?.status === "completed" ? ORDER.length : ORDER.indexOf(step);
  const dep = instr as DepositInstructions | null;
  const wd = instr as WithdrawInstructions | null;
  const inUnit = isDeposit ? "MXN" : ASSET;
  const outUnit = isDeposit ? ASSET : "MXN";

  return (
    <div className={styles.page}>
      {!embedded && <SiteHeader minimal badge={sandbox ? "Modo prueba" : "Testnet"} />}

      <main id="main" className={styles.main}>
        {!embedded && <div className={styles.kindHead}>
          <span className={`${styles.kindIcon} ${isDeposit ? styles.kindDep : styles.kindWd}`} aria-hidden="true">
            {isDeposit ? Icon.down(22) : Icon.up(22)}
          </span>
          <div className={styles.kindText}>
            <h1 className={styles.kindTitle}>{isDeposit ? `Depositar ${ASSET}` : `Retirar ${ASSET}`}</h1>
            <p className={styles.kindSub}>{isDeposit ? `SPEI → Stellar` : `Stellar → SPEI`}</p>
          </div>
          {tx && tx.status !== "incomplete" && <StatusBadge status={tx.status} />}
        </div>}

        {step !== "fatal" && step !== "loading" && (
          <ol className={styles.stepper} aria-label="Progreso">
            {STEPS.map((s, i) => (
              <li key={s.key} className={styles.stepItem} data-state={cur > i ? "done" : cur === i ? "active" : "todo"} aria-current={cur === i ? "step" : undefined}>
                <span className={styles.stepDot}>{cur > i ? Icon.check(12) : i + 1}</span>
                <span className={styles.stepLabel}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        {step === "loading" && (
          <div className={styles.center} role="status">
            <Spinner />
            <span>Cargando tu operación…</span>
          </div>
        )}

        {step === "fatal" && (
          <div className={`${ui.card} ${styles.result}`}>
            <span className={`${styles.resultIcon} ${styles.resultErr}`}>{Icon.alert(30)}</span>
            <h2 className={styles.resultTitle}>No pudimos abrir la operación</h2>
            <p className={ui.muted}>{fatal}</p>
            <button type="button" className={`${ui.btn} ${ui.secondary} ${ui.btnBlock}`} onClick={backToWallet}>Volver a la wallet</button>
          </div>
        )}

        {/* ── Monto ── */}
        {step === "form" && (
          <form className={styles.stack} onSubmit={handleQuote} noValidate>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="amount">Monto a {isDeposit ? "depositar" : "retirar"}</label>
              <div className={ui.inputWrap}>
                <input
                  ref={firstField}
                  id="amount"
                  className={ui.input}
                  style={{ paddingRight: 64 }}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  enterKeyHint="next"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
                  onBlur={() => setTouched(true)}
                  aria-invalid={touched && !!amountErr}
                  aria-describedby="amount-hint"
                />
                <span className={ui.inputSuffix}>{inUnit}</span>
              </div>
              {touched && amountErr
                ? <span id="amount-hint" className={ui.fieldError}>{amountErr}</span>
                : <span id="amount-hint" className={ui.hint}>Entre ${MIN_AMOUNT} y ${MAX_AMOUNT.toLocaleString("es-MX")} {inUnit}.</span>}
            </div>

            {!isDeposit && (
              <div className={ui.field}>
                <label className={ui.label} htmlFor="clabe">CLABE destino</label>
                <input
                  id="clabe"
                  className={`${ui.input} ${ui.inputMono}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="done"
                  maxLength={18}
                  placeholder="18 dígitos"
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))}
                  onBlur={() => setTouched(true)}
                  aria-invalid={touched && !!clabeErr}
                  aria-describedby="clabe-hint"
                />
                {touched && clabeErr
                  ? <span id="clabe-hint" className={ui.fieldError}>{clabeErr}</span>
                  : <span id="clabe-hint" className={ui.hint}>{clabe.length}/18 dígitos.</span>}
                {sandbox && (
                  <button type="button" className={ui.linkBtn} style={{ alignSelf: "flex-start" }} onClick={() => setClabe(DEMO_CLABE)}>
                    Usar CLABE de prueba
                  </button>
                )}
              </div>
            )}

            {sandbox && <SandboxNotice />}
            {err && <div className={ui.alert} role="alert">{Icon.alert(16)}<span>{err}</span></div>}

            <div className={styles.actions}>
              <button type="submit" className={`${ui.btn} ${ui.primary} ${ui.btnBlock}`} disabled={loading} aria-busy={loading}>
                {loading ? <><Spinner />Cotizando…</> : <>Ver cotización {Icon.arrow(16)}</>}
              </button>
            </div>
          </form>
        )}

        {/* ── Cotización ── */}
        {step === "quote" && quote && (
          <div className={styles.stack}>
            <div className={`${ui.card} ${styles.swap}`}>
              <div className={styles.swapSide}>
                <span className={styles.swapLabel}>Envías</span>
                <span className={styles.swapAmt}>{formatAmount(quote.sell_amount)}</span>
                <span className={styles.swapUnit}>{inUnit}</span>
              </div>
              <span className={styles.swapArrow} aria-hidden="true">{Icon.arrow(20)}</span>
              <div className={styles.swapSide}>
                <span className={styles.swapLabel}>Recibes</span>
                <span className={`${styles.swapAmt} ${styles.swapOut}`}>{formatAmount(quote.buy_amount)}</span>
                <span className={styles.swapUnit}>{outUnit}</span>
              </div>
            </div>

            <dl className={`${ui.card} ${styles.quoteRows}`}>
              <div><dt>Tipo de cambio</dt><dd>1 {ASSET} = {formatAmount(quote.price, 4)} MXN</dd></div>
              <div><dt>Comisión (0.5 %)</dt><dd>{formatAmount(quote.fee, 4)} {inUnit}</dd></div>
              <div><dt>Válida hasta</dt><dd>{new Date(quote.expires_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</dd></div>
              {!isDeposit && <div><dt>CLABE destino</dt><dd className="addr">{clabe}</dd></div>}
            </dl>

            {err && <div className={ui.alert} role="alert">{Icon.alert(16)}<span>{err}</span></div>}

            <div className={styles.actions}>
              <button type="button" className={`${ui.btn} ${ui.primary} ${ui.btnBlock}`} onClick={handleConfirm} disabled={loading} aria-busy={loading}>
                {loading ? <><Spinner />Confirmando…</> : "Confirmar operación"}
              </button>
              <button type="button" className={`${ui.btn} ${ui.ghost} ${ui.btnBlock}`} onClick={() => { setErr(""); setStep("form"); }} disabled={loading} aria-busy={loading}>
                Cambiar monto
              </button>
            </div>
          </div>
        )}

        {/* ── Instrucciones de pago ── */}
        {step === "instructions" && (
          <div className={styles.stack}>
            {isDeposit && dep?.clabe ? (
              <>
                <div className={ui.card}>
                  <h2 className={styles.cardH}>Transfiere por SPEI</h2>
                  <div className={ui.kvList}>
                    <div className={ui.kv}><span className={ui.kvKey}>Monto exacto</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{formatAmount(amount)} MXN</span><CopyButton value={amount} label="Monto" /></div>
                    <div className={ui.kv}><span className={ui.kvKey}>CLABE</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{dep.clabe}</span><CopyButton value={dep.clabe} label="CLABE" /></div>
                    <div className={ui.kv}><span className={ui.kvKey}>Referencia</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{dep.reference}</span><CopyButton value={dep.reference} label="Referencia" /></div>
                    <div className={ui.kv}><span className={ui.kvKey}>Banco</span><span className={ui.kvVal}>{dep.bank_name}</span></div>
                    <div className={ui.kv}><span className={ui.kvKey}>Beneficiario</span><span className={ui.kvVal}>{dep.beneficiary}</span></div>
                  </div>
                </div>
                {sandbox ? (
                  <>
                    <SandboxNotice>Esta CLABE es ficticia. En lugar de transferir, simula que el SPEI llegó: el anchor enviará {ASSET} reales de testnet a tu wallet.</SandboxNotice>
                    <div className={styles.actions}>
                      <button type="button" className={`${ui.btn} ${ui.primary} ${ui.btnBlock}`} onClick={handleSimulate} disabled={simulating} aria-busy={simulating}>
                        {simulating ? <><Spinner />Enviando {ASSET} en Stellar…</> : "Simular SPEI recibido"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className={ui.muted}>Incluye la referencia exacta. Detectaremos tu pago y acreditaremos {ASSET} en tu wallet.</p>
                )}
              </>
            ) : !isDeposit && wd?.anchor_account ? (
              <>
                <div className={ui.card}>
                  <h2 className={styles.cardH}>Envía {ASSET} al anchor</h2>
                  <div className={ui.kvList}>
                    <div className={ui.kv}><span className={ui.kvKey}>Monto</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{formatAmount(amount)} {ASSET}</span></div>
                    <div className={ui.kv}><span className={ui.kvKey}>Cuenta Stellar</span><span className={`${ui.kvVal} ${ui.kvMono}`} title={wd.anchor_account}>{truncateMiddle(wd.anchor_account, 8, 8)}</span><CopyButton value={wd.anchor_account} label="Cuenta" /></div>
                    <div className={ui.kv}><span className={ui.kvKey}>Memo ({wd.anchor_memo_type})</span><span className={`${ui.kvVal} ${ui.kvMono}`}>{wd.anchor_memo}</span><CopyButton value={wd.anchor_memo} label="Memo" /></div>
                  </div>
                </div>
                <p className={ui.muted}>
                  {embedded
                    ? <>Tu wallet firma este pago con tu llave; SEPuente nunca la ve. Al confirmar, esta pantalla detecta el pago sola.</>
                    : <>Tu wallet firma este pago, no SEPuente. En la wallet demo toca <strong>«Enviar {ASSET} al anchor»</strong> en el historial; esta pantalla se actualiza sola al detectarlo.</>}
                </p>
                {sandbox && <SandboxNotice>El pago en Stellar es real (testnet); el SPEI a tu CLABE es simulado.</SandboxNotice>}
                {paid && <div className={ui.notice} role="status" style={{ borderColor: "rgb(var(--success-rgb) / 0.35)", background: "var(--success-dim)" }}>{Icon.check(16)}<span>Pago enviado desde tu wallet. Esperando que el anchor lo confirme…</span></div>}
                <div className={styles.actions}>
                  {embedded ? (
                    <button type="button" className={`${ui.btn} ${ui.primary} ${ui.btnBlock}`} onClick={requestPayment} disabled={paying || paid} aria-busy={paying}>
                      {paying ? <><Spinner />Firmando en tu wallet…</> : paid ? <>{Icon.check(16)} Pago enviado</> : <>Enviar {formatAmount(amount)} {ASSET} desde mi wallet</>}
                    </button>
                  ) : (
                    <button type="button" className={`${ui.btn} ${ui.secondary} ${ui.btnBlock}`} onClick={backToWallet}>Volver a la wallet</button>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.center}><Spinner /><span>Preparando instrucciones…</span></div>
            )}

            <div className={styles.polling} role="status">
              <span className={styles.pollDot} aria-hidden="true" />
              {pollFails >= 3 ? "Sin conexión con el anchor, reintentando…" : "Esperando confirmación del pago…"}
            </div>

            {err && <div className={ui.alert} role="alert">{Icon.alert(16)}<span>{err}</span></div>}
          </div>
        )}

        {/* ── Resultado ── */}
        {step === "done" && tx && (
          tx.status === "completed" ? (
            <div className={`${ui.card} ${styles.result}`}>
              <span className={`${styles.resultIcon} ${styles.resultOk}`}>{Icon.check(30)}</span>
              <h2 className={styles.resultTitle}>{isDeposit ? `${ASSET} acreditado` : "Retiro completado"}</h2>
              <p className={ui.muted}>
                {isDeposit
                  ? `Recibiste ${formatAmount(tx.amount_out)} ${ASSET} en tu wallet de testnet.`
                  : sandbox
                    ? `El anchor recibió tus ${ASSET}. En modo prueba no se envía un SPEI real; en producción llegarían ${formatAmount(tx.amount_out)} MXN a tu CLABE.`
                    : `El anchor recibió tus ${ASSET} y envió el SPEI a tu CLABE.`}
              </p>
              {tx.stellar_transaction_id && (
                <a className={`${ui.btn} ${ui.secondary} ${ui.btnBlock}`} href={`${EXPLORER_TX}${tx.stellar_transaction_id}`} target="_blank" rel="noreferrer">
                  Ver en stellar.expert <span className={`addr ${styles.hash}`}>{truncateMiddle(tx.stellar_transaction_id, 4, 4)}</span> {Icon.external(14)}
                </a>
              )}
              <button type="button" className={`${ui.btn} ${ui.primary} ${ui.btnBlock}`} onClick={backToWallet}>Volver a la wallet</button>
            </div>
          ) : (
            <div className={`${ui.card} ${styles.result}`}>
              <span className={`${styles.resultIcon} ${styles.resultErr}`}>{Icon.alert(30)}</span>
              <h2 className={styles.resultTitle}>{tx.status === "expired" ? "La operación expiró" : "La operación no se completó"}</h2>
              <p className={ui.muted}>{tx.error_message ?? "No se movió ningún fondo. Puedes iniciar una operación nueva desde tu wallet."}</p>
              <button type="button" className={`${ui.btn} ${ui.primary} ${ui.btnBlock}`} onClick={backToWallet}>Volver a la wallet</button>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function InteractivePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.center} role="status"><Spinner /><span>Cargando…</span></div>
        </div>
      }
    >
      <InteractiveContent />
    </Suspense>
  );
}
