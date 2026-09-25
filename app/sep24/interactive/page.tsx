"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

/* ─── Estilos inline con tema UNAM ─────────────────────────────────────── */
const css = `
  :root {
    --navy: #0A1A33;
    --surface: #11284D;
    --gold: #C9A227;
    --cream: #F5F1E6;
    --text: #E8E2D5;
    --muted: #8B9BB5;
    --error: #E05252;
    --success: #4CAF82;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--navy);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    min-height: 100dvh;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
  .card {
    max-width: 420px;
    margin: 24px auto;
    background: var(--surface);
    border-radius: 16px;
    padding: 28px 24px;
    border: 1px solid rgba(201,162,39,0.2);
  }
  h1 { font-size: 1.25rem; color: var(--gold); margin-bottom: 4px; }
  .subtitle { font-size: 0.8rem; color: var(--muted); margin-bottom: 20px; }
  label { font-size: 0.75rem; color: var(--muted); display: block; margin-bottom: 4px; }
  input {
    width: 100%; padding: 10px 12px; border-radius: 8px;
    border: 1px solid rgba(139,155,181,0.3);
    background: rgba(255,255,255,0.06);
    color: var(--text); font-size: 0.95rem; margin-bottom: 14px;
  }
  input:focus { outline: none; border-color: var(--gold); }
  button {
    width: 100%; padding: 12px; border-radius: 10px; border: none; cursor: pointer;
    font-size: 0.95rem; font-weight: 600; transition: opacity 0.15s;
  }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-primary { background: var(--gold); color: var(--navy); }
  .btn-secondary {
    background: transparent; color: var(--gold);
    border: 1.5px solid var(--gold); margin-top: 10px;
  }
  .info-box {
    background: rgba(201,162,39,0.08);
    border: 1px solid rgba(201,162,39,0.25);
    border-radius: 10px; padding: 14px; margin-bottom: 16px;
  }
  .info-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; }
  .info-label { color: var(--muted); }
  .info-val { color: var(--cream); font-weight: 600; font-family: monospace; }
  .copy-btn {
    background: none; border: none; color: var(--gold); cursor: pointer;
    font-size: 0.75rem; width: auto; padding: 2px 6px;
  }
  .status-badge {
    display: inline-block; padding: 4px 10px; border-radius: 20px;
    font-size: 0.78rem; font-weight: 600; margin-bottom: 12px;
  }
  .status-incomplete { background: rgba(139,155,181,0.15); color: var(--muted); }
  .status-pending_user_transfer_start { background: rgba(201,162,39,0.15); color: var(--gold); }
  .status-pending_anchor { background: rgba(74,144,226,0.15); color: #7ab3f5; }
  .status-completed { background: rgba(76,175,130,0.15); color: var(--success); }
  .status-error { background: rgba(224,82,82,0.15); color: var(--error); }
  .err { color: var(--error); font-size: 0.82rem; margin-top: 8px; }
  .success { color: var(--success); font-size: 0.82rem; margin-top: 8px; }
  .divider { border: none; border-top: 1px solid rgba(139,155,181,0.15); margin: 16px 0; }
  .fee-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--muted); }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 460px) { .card { margin: 0; border-radius: 0; min-height: 100dvh; } }
`;

interface QuoteResult {
  sell_amount: string;
  buy_amount: string;
  price: string;
  fee: string;
  expires_at: string;
}

interface DepositInstructions {
  clabe: string;
  reference: string;
  bank_name: string;
  beneficiary: string;
}

interface WithdrawInstructions {
  anchor_account: string;
  anchor_memo: string;
  anchor_memo_type: string;
}

interface TxData {
  id: string;
  kind: string;
  status: string;
  amount_in?: string;
  amount_out?: string;
  stellar_transaction_id?: string;
  error_message?: string;
}

type Step = "form" | "quote" | "instructions" | "done";

function InteractiveContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const kind = searchParams.get("kind") ?? "deposit"; // deposit | withdraw
  const initialAmount = searchParams.get("amount") ?? "";

  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState(initialAmount);
  const [clabe, setClabe] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [instructions, setInstructions] = useState<DepositInstructions | WithdrawInstructions | null>(null);
  const [tx, setTx] = useState<TxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [copied, setCopied] = useState("");
  const [isMock] = useState(true); // siempre mostrar simulate en sandbox

  async function apiCall(body: Record<string, string>) {
    const res = await fetch("/api/sep24", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, token }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? "Error desconocido");
    return data;
  }

  async function handleQuote() {
    setErr("");
    if (!amount || parseFloat(amount) < 10) {
      setErr("El monto mínimo es $10 MXN");
      return;
    }
    setLoading(true);
    try {
      const q = await apiCall({ action: "quote", sell_amount: amount });
      setQuote(q);
      setStep("quote");
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setErr("");
    setLoading(true);
    try {
      if (kind === "deposit") {
        const data = await apiCall({ action: "start_deposit", amount });
        setInstructions(data);
      } else {
        const data = await apiCall({ action: "start_withdraw", amount, clabe });
        setInstructions(data);
      }
      setStep("instructions");
      // Empieza a sondear el estado
      pollStatus();
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function pollStatus() {
    const iv = setInterval(async () => {
      try {
        const data = await apiCall({ action: "status" });
        setTx(data.transaction);
        if (
          data.transaction?.status === "completed" ||
          data.transaction?.status === "error" ||
          data.transaction?.status === "expired"
        ) {
          clearInterval(iv);
          setStep("done");
        }
      } catch {/* silencioso */}
    }, 4000);
    return () => clearInterval(iv);
  }

  async function handleSimulate() {
    setSimulating(true);
    setErr("");
    try {
      await apiCall({ action: "simulate" });
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setSimulating(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const depInstr = instructions as DepositInstructions | null;
  const wdInstr = instructions as WithdrawInstructions | null;
  const isDeposit = kind === "deposit";

  return (
    <>
      <style>{css}</style>
      <div className="card">
        <h1>{isDeposit ? "⬇ Depositar" : "⬆ Retirar"} {isDeposit ? "MXN → TMXN" : "TMXN → MXN"}</h1>
        <div className="subtitle">SEPuente · Anchor demo · Solo testnet</div>

        {tx && (
          <div className={`status-badge status-${tx.status}`}>
            {tx.status.replace(/_/g, " ")}
          </div>
        )}

        {/* ── STEP: form ── */}
        {step === "form" && (
          <>
            <label>Monto (MXN)</label>
            <input
              type="number"
              min={10}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
            {!isDeposit && (
              <>
                <label>CLABE destino (18 dígitos)</label>
                <input
                  type="text"
                  maxLength={18}
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value.replace(/\D/g, ""))}
                  placeholder="6461801570000000XX"
                />
              </>
            )}
            {err && <div className="err">{err}</div>}
            <button className="btn-primary" onClick={handleQuote} disabled={loading}>
              {loading ? <><span className="spinner" />Cotizando…</> : "Ver cotización"}
            </button>
          </>
        )}

        {/* ── STEP: quote ── */}
        {step === "quote" && quote && (
          <>
            <div className="info-box">
              <div className="fee-row"><span>Envías</span><span>{parseFloat(quote.sell_amount).toFixed(2)} MXN</span></div>
              <div className="fee-row"><span>Recibes</span><span>{parseFloat(quote.buy_amount).toFixed(7)} TMXN</span></div>
              <div className="fee-row"><span>Comisión</span><span>{parseFloat(quote.fee).toFixed(7)} TMXN</span></div>
              <div className="fee-row"><span>Precio</span><span>1 TMXN = 1 MXN</span></div>
            </div>
            {err && <div className="err">{err}</div>}
            <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
              {loading ? <><span className="spinner" />Iniciando…</> : "Confirmar"}
            </button>
            <button className="btn-secondary" onClick={() => setStep("form")}>Atrás</button>
          </>
        )}

        {/* ── STEP: instructions ── */}
        {step === "instructions" && instructions && (
          <>
            {isDeposit && depInstr ? (
              <>
                <div className="info-box">
                  <div className="info-row">
                    <span className="info-label">CLABE</span>
                    <span className="info-val">
                      {depInstr.clabe}
                      <button className="copy-btn" onClick={() => copy(depInstr.clabe, "clabe")}>
                        {copied === "clabe" ? "✓" : "copiar"}
                      </button>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Referencia</span>
                    <span className="info-val">
                      {depInstr.reference}
                      <button className="copy-btn" onClick={() => copy(depInstr.reference, "ref")}>
                        {copied === "ref" ? "✓" : "copiar"}
                      </button>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Banco</span>
                    <span className="info-val">{depInstr.bank_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Beneficiario</span>
                    <span className="info-val">{depInstr.beneficiary}</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 14 }}>
                  Transfiere el monto exacto con la referencia indicada. Cuando SEPuente detecte el SPEI, recibirás TMXN en tu wallet.
                </p>
                {isMock && (
                  <button className="btn-secondary" onClick={handleSimulate} disabled={simulating}>
                    {simulating ? <><span className="spinner" />Simulando…</> : "🧪 Simular SPEI recibido"}
                  </button>
                )}
              </>
            ) : wdInstr ? (
              <>
                <div className="info-box">
                  <div className="info-row">
                    <span className="info-label">Cuenta destino</span>
                    <span className="info-val" style={{ fontSize: "0.7rem" }}>
                      {wdInstr.anchor_account}
                      <button className="copy-btn" onClick={() => copy(wdInstr.anchor_account, "acc")}>
                        {copied === "acc" ? "✓" : "copiar"}
                      </button>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Memo ({wdInstr.anchor_memo_type})</span>
                    <span className="info-val">
                      {wdInstr.anchor_memo}
                      <button className="copy-btn" onClick={() => copy(wdInstr.anchor_memo, "memo")}>
                        {copied === "memo" ? "✓" : "copiar"}
                      </button>
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 14 }}>
                  Envía {amount} TMXN a la cuenta y memo indicados. El ancla procesará el pago SPEI a tu CLABE.
                </p>
              </>
            ) : null}
            {err && <div className="err">{err}</div>}
            {tx?.status === "completed" && (
              <div className="success">
                ✓ Completado{tx.stellar_transaction_id ? ` · tx: ${tx.stellar_transaction_id.slice(0, 12)}…` : ""}
              </div>
            )}
          </>
        )}

        {/* ── STEP: done ── */}
        {step === "done" && tx && (
          <>
            {tx.status === "completed" ? (
              <div className="success">
                ✓ Transacción completada
                {tx.stellar_transaction_id && (
                  <>
                    {" "}&mdash;{" "}
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.stellar_transaction_id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--gold)" }}
                    >
                      Ver en stellar.expert ↗
                    </a>
                  </>
                )}
              </div>
            ) : (
              <div className="err">Estado: {tx.status}{tx.error_message ? ` — ${tx.error_message}` : ""}</div>
            )}
            <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => window.close()}>
              Cerrar
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function InteractivePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#E8E2D5" }}>Cargando…</div>}>
      <InteractiveContent />
    </Suspense>
  );
}
