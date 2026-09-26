"use client";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  :root {
    --navy:    #0A1A33;
    --surface: #11284D;
    --s2:      #162F59;
    --gold:    #C9A227;
    --cream:   #F5F1E6;
    --text:    #E8E2D5;
    --muted:   #8B9BB5;
    --error:   #E05252;
    --success: #4CD68E;
    --blue:    #7DBAFF;
    --border:  rgba(139,155,181,0.14);
    --r:       14px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--navy);
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  /* ── 3D BACKGROUND ── */
  .bg-scene {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  /* Mesh grid */
  .bg-scene::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(139,155,181,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,155,181,0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 80%);
  }

  /* Radial vignette */
  .bg-scene::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(10,26,51,0.7) 100%);
  }

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
  }

  .blob-gold {
    width: 260px; height: 220px;
    background: radial-gradient(circle, rgba(201,162,39,0.18) 0%, rgba(201,162,39,0.05) 60%, transparent 80%);
    top: -60px; left: -40px;
    animation: driftA 12s ease-in-out infinite;
  }

  .blob-blue {
    width: 220px; height: 280px;
    background: radial-gradient(circle, rgba(125,186,255,0.13) 0%, rgba(125,186,255,0.04) 60%, transparent 80%);
    bottom: -80px; right: -30px;
    animation: driftB 15s ease-in-out infinite;
  }

  .blob-green {
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(76,214,142,0.08) 0%, rgba(76,214,142,0.02) 60%, transparent 80%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    animation: driftC 18s ease-in-out infinite;
  }

  /* 3D floating cards/planes */
  .bg-plane {
    position: absolute;
    border: 1px solid rgba(139,155,181,0.06);
    border-radius: 16px;
    background: rgba(255,255,255,0.015);
    backdrop-filter: blur(1px);
    transform-style: preserve-3d;
  }

  .bg-plane-1 {
    width: 120px; height: 80px;
    top: 80px; right: 20px;
    transform: perspective(400px) rotateY(-18deg) rotateX(8deg);
    animation: floatA 8s ease-in-out infinite;
    background: linear-gradient(135deg, rgba(201,162,39,0.05) 0%, transparent 100%);
    border-color: rgba(201,162,39,0.08);
  }

  .bg-plane-2 {
    width: 80px; height: 55px;
    bottom: 120px; left: 10px;
    transform: perspective(400px) rotateY(14deg) rotateX(-6deg);
    animation: floatB 10s ease-in-out infinite;
    background: linear-gradient(135deg, rgba(125,186,255,0.04) 0%, transparent 100%);
    border-color: rgba(125,186,255,0.07);
  }

  .bg-plane-3 {
    width: 60px; height: 40px;
    top: 30%; right: 8px;
    transform: perspective(400px) rotateY(-22deg) rotateX(12deg);
    animation: floatC 12s ease-in-out infinite;
    background: rgba(76,214,142,0.03);
    border-color: rgba(76,214,142,0.06);
  }

  /* Floating orb accents */
  .bg-orb {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, currentColor 0%, transparent 70%);
    opacity: 0.35;
  }
  .bg-orb-1 { width:6px; height:6px; color:rgba(201,162,39,0.7); top:25%; left:12%; animation: orbitA 6s ease-in-out infinite; }
  .bg-orb-2 { width:4px; height:4px; color:rgba(125,186,255,0.7); top:60%; right:15%; animation: orbitB 8s ease-in-out infinite; }
  .bg-orb-3 { width:5px; height:5px; color:rgba(76,214,142,0.6); bottom:30%; left:20%; animation: orbitC 7s ease-in-out infinite; }

  /* Content layer */
  nav, .steps, .wrap { position: relative; z-index: 1; }

  @keyframes driftA {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(20px,15px) scale(1.08); }
    66%      { transform: translate(-10px,25px) scale(0.95); }
  }
  @keyframes driftB {
    0%,100% { transform: translate(0,0) scale(1); }
    40%      { transform: translate(-25px,-15px) scale(1.1); }
    70%      { transform: translate(10px,-30px) scale(0.92); }
  }
  @keyframes driftC {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    50%      { transform: translate(calc(-50% + 30px), calc(-50% - 20px)) scale(1.15); }
  }
  @keyframes floatA {
    0%,100% { transform: perspective(400px) rotateY(-18deg) rotateX(8deg) translateY(0px); }
    50%      { transform: perspective(400px) rotateY(-14deg) rotateX(12deg) translateY(-8px); }
  }
  @keyframes floatB {
    0%,100% { transform: perspective(400px) rotateY(14deg) rotateX(-6deg) translateY(0px); }
    50%      { transform: perspective(400px) rotateY(18deg) rotateX(-10deg) translateY(6px); }
  }
  @keyframes floatC {
    0%,100% { transform: perspective(400px) rotateY(-22deg) rotateX(12deg) translateY(0px); }
    50%      { transform: perspective(400px) rotateY(-18deg) rotateX(8deg) translateY(-5px); }
  }
  @keyframes orbitA {
    0%,100% { transform: translate(0,0); opacity: 0.35; }
    50%      { transform: translate(8px,-12px); opacity: 0.7; }
  }
  @keyframes orbitB {
    0%,100% { transform: translate(0,0); opacity: 0.35; }
    50%      { transform: translate(-10px,8px); opacity: 0.6; }
  }
  @keyframes orbitC {
    0%,100% { transform: translate(0,0); opacity: 0.35; }
    50%      { transform: translate(12px,-6px); opacity: 0.55; }
  }

  /* ── NAV ── */
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    background: rgba(10,26,51,0.9);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .nav-brand {
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--cream);
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: -0.01em;
  }
  .nav-sym { color: var(--gold); }
  .nav-badge {
    font-size: 0.62rem;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    background: rgba(201,162,39,0.1);
    border: 1px solid rgba(201,162,39,0.2);
    color: rgba(201,162,39,0.8);
    padding: 3px 8px;
    border-radius: 8px;
  }

  /* ── STEP PILLS ── */
  .steps {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
  }
  .sp {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(139,155,181,0.3);
  }
  .sp.active { color: var(--cream); }
  .sp.done   { color: var(--success); }
  .sp-dot {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    background: rgba(139,155,181,0.07);
    border: 1.5px solid rgba(139,155,181,0.15);
    flex-shrink: 0;
  }
  .sp.active .sp-dot {
    background: rgba(201,162,39,0.12);
    border-color: rgba(201,162,39,0.4);
    color: var(--gold);
  }
  .sp.done .sp-dot {
    background: rgba(47,191,113,0.12);
    border-color: rgba(47,191,113,0.35);
    color: var(--success);
  }
  .sp-line {
    flex: 1;
    height: 1px;
    background: rgba(139,155,181,0.1);
    margin: 0 6px;
  }
  .sp-line.filled { background: rgba(47,191,113,0.3); }

  /* ── MAIN ── */
  .wrap {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── KIND HEADER ── */
  .kind-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .kind-icon {
    width: 44px; height: 44px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .kind-icon.deposit  { background: rgba(47,191,113,0.1);  color: var(--success); }
  .kind-icon.withdraw { background: rgba(125,186,255,0.1); color: var(--blue); }
  .kind-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--cream);
    letter-spacing: -0.03em;
    line-height: 1.15;
  }
  .kind-sub { font-size: 0.72rem; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }

  /* ── FORM ── */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .field-input-wrap { position: relative; }
  .field-input {
    width: 100%;
    padding: 13px 14px;
    border-radius: 11px;
    border: 1.5px solid var(--border);
    background: rgba(255,255,255,0.03);
    color: var(--cream);
    font-size: 1rem;
    font-weight: 600;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.02em;
  }
  .field-input:focus {
    outline: none;
    border-color: rgba(201,162,39,0.5);
    box-shadow: 0 0 0 3px rgba(201,162,39,0.08);
  }
  .field-input::placeholder { color: rgba(139,155,181,0.35); }
  .field-unit {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    font-size: 0.72rem;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.06em;
    color: var(--muted);
  }
  .field-hint { font-size: 0.7rem; color: rgba(139,155,181,0.45); }

  /* ── QUOTE CARD ── */
  .quote-card {
    background: rgba(17,40,77,0.5);
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
  }
  .q-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .q-row:last-child { border-bottom: none; }
  .q-label { font-size: 0.75rem; color: var(--muted); }
  .q-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--cream);
  }
  .q-val.green { color: var(--success); font-size: 1rem; }
  .q-val.muted { color: var(--muted); font-size: 0.8rem; }

  .swap-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 4px 0;
  }
  .swap-from, .swap-to {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    background: rgba(255,255,255,0.02);
    border-radius: 10px;
    padding: 12px 10px;
    border: 1px solid var(--border);
  }
  .swap-cur {
    font-size: 0.65rem;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .swap-amt {
    font-family: 'Syne', sans-serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--cream);
    letter-spacing: -0.03em;
  }
  .swap-chevron { color: var(--muted); flex-shrink: 0; }

  /* ── INSTRUCTIONS ── */
  .instr-card {
    background: rgba(17,40,77,0.5);
    border: 1px solid var(--border);
    border-radius: var(--r);
    overflow: hidden;
  }
  .instr-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(139,155,181,0.07);
    gap: 8px;
  }
  .instr-row:last-child { border-bottom: none; }
  .instr-key { font-size: 0.72rem; color: var(--muted); flex-shrink: 0; }
  .instr-val-wrap { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .instr-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--cream);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .copy-btn {
    background: rgba(201,162,39,0.08);
    border: 1px solid rgba(201,162,39,0.2);
    border-radius: 6px;
    color: var(--gold);
    cursor: pointer;
    font-size: 0.65rem;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.04em;
    padding: 3px 7px;
    transition: all 0.12s;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .copy-btn:hover { background: rgba(201,162,39,0.14); }
  .copy-btn.ok { background: rgba(47,191,113,0.1); border-color: rgba(47,191,113,0.25); color: var(--success); }

  .instr-hint {
    font-size: 0.78rem;
    color: var(--muted);
    line-height: 1.55;
    background: rgba(201,162,39,0.04);
    border: 1px solid rgba(201,162,39,0.1);
    border-radius: 10px;
    padding: 12px 14px;
  }

  /* ── STATUS ── */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .status-pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .s-incomplete    { background: rgba(139,155,181,0.1); color: var(--muted); }
  .s-pending_user  { background: rgba(201,162,39,0.12); color: var(--gold); }
  .s-pending_anchor{ background: rgba(125,186,255,0.1); color: var(--blue); }
  .s-completed     { background: rgba(47,191,113,0.12); color: var(--success); }
  .s-error, .s-expired { background: rgba(224,82,82,0.1); color: var(--error); }

  /* ── DONE STATE ── */
  .done-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 32px 0;
    text-align: center;
  }
  .done-icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(47,191,113,0.12);
    border: 2px solid rgba(47,191,113,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--success);
  }
  .done-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--cream);
    letter-spacing: -0.03em;
  }
  .done-sub { font-size: 0.8rem; color: var(--muted); max-width: 280px; line-height: 1.5; }
  .done-link {
    color: var(--gold);
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 14px;
    border-radius: 9px;
    background: rgba(201,162,39,0.07);
    border: 1px solid rgba(201,162,39,0.2);
    transition: all 0.12s;
  }
  .done-link:hover { background: rgba(201,162,39,0.13); }

  .err-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 0;
    text-align: center;
  }
  .err-icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: rgba(224,82,82,0.1);
    border: 2px solid rgba(224,82,82,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--error);
  }

  /* ── BUTTONS ── */
  .btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s;
    letter-spacing: 0.01em;
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-gold {
    background: var(--gold);
    color: var(--navy);
  }
  .btn-gold:hover:not(:disabled) {
    background: #d6ac2a;
    box-shadow: 0 4px 20px rgba(201,162,39,0.25);
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: rgba(139,155,181,0.06);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .btn-ghost:hover:not(:disabled) { background: rgba(139,155,181,0.1); color: var(--cream); }
  .btn-simulate {
    background: rgba(125,186,255,0.06);
    border: 1px dashed rgba(125,186,255,0.2);
    color: var(--blue);
    font-size: 0.8rem;
  }
  .btn-simulate:hover:not(:disabled) { background: rgba(125,186,255,0.1); border-style: solid; }
  .btn-close {
    background: rgba(139,155,181,0.06);
    border: 1px solid var(--border);
    color: var(--muted);
  }

  /* ── ERROR MSG ── */
  .err-msg {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 13px;
    border-radius: 9px;
    background: rgba(224,82,82,0.08);
    border: 1px solid rgba(224,82,82,0.18);
    color: #f07070;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  /* ── POLLING INDICATOR ── */
  .polling {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    color: var(--muted);
    padding: 8px 12px;
    background: rgba(139,155,181,0.04);
    border-radius: 8px;
    border: 1px solid rgba(139,155,181,0.08);
  }
  .poll-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--gold);
    animation: blink 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── SPINNER ── */
  .spin {
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-right-color: transparent;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.22s ease-out; }
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

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "form",         label: "Monto" },
  { key: "quote",        label: "Cotización" },
  { key: "instructions", label: "Instrucciones" },
  { key: "done",         label: "Listo" },
];

const STEP_ORDER: Step[] = ["form", "quote", "instructions", "done"];

function stepIdx(s: Step) { return STEP_ORDER.indexOf(s); }

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function InteractiveContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const kind = searchParams.get("kind") ?? "deposit";
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

  const isDeposit = kind === "deposit";

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
      let data;
      if (isDeposit) {
        data = await apiCall({ action: "start_deposit", amount });
      } else {
        data = await apiCall({ action: "start_withdraw", amount, clabe });
      }
      setInstructions(data);
      setStep("instructions");
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
        if (["completed", "error", "expired"].includes(data.transaction?.status)) {
          clearInterval(iv);
          setStep("done");
        }
      } catch { /* silencioso */ }
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
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }).finally(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const depInstr = instructions as DepositInstructions | null;
  const wdInstr  = instructions as WithdrawInstructions | null;
  const curStepIdx = stepIdx(step);

  const statusClass: Record<string, string> = {
    incomplete:                  "s-incomplete",
    pending_user_transfer_start: "s-pending_user",
    pending_anchor:              "s-pending_anchor",
    completed:                   "s-completed",
    error:                       "s-error",
    expired:                     "s-expired",
  };

  return (
    <>
      <style>{css}</style>

      {/* ── 3D BACKGROUND ── */}
      <div className="bg-scene">
        <div className="blob blob-gold" />
        <div className="blob blob-blue" />
        <div className="blob blob-green" />
        <div className="bg-plane bg-plane-1" />
        <div className="bg-plane bg-plane-2" />
        <div className="bg-plane bg-plane-3" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-sym">⟴</span>
          SEPuente
        </div>
        <div className="nav-badge">Testnet · Demo</div>
      </nav>

      {/* ── STEP PILLS ── */}
      <div className="steps">
        {STEP_LABELS.map((s, i) => {
          const done   = curStepIdx > i;
          const active = curStepIdx === i;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? "1" : "0" }}>
              <div className={`sp ${done ? "done" : active ? "active" : ""}`}>
                <div className="sp-dot">
                  {done ? <CheckIcon size={9} /> : i + 1}
                </div>
                <span>{s.label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`sp-line ${done ? "filled" : ""}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="wrap">

        {/* ── KIND HEADER ── */}
        <div className="kind-head">
          <div className={`kind-icon ${isDeposit ? "deposit" : "withdraw"}`}>
            {isDeposit
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13M5 14l7 7 7-7"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V8M5 10l7-7 7 7"/></svg>
            }
          </div>
          <div>
            <div className="kind-title">{isDeposit ? "Depositar TMXN" : "Retirar TMXN"}</div>
            <div className="kind-sub">{isDeposit ? "SPEI → Stellar · TMXN" : "Stellar · TMXN → SPEI"}</div>
          </div>
          {tx && (
            <div className={`status-pill ${statusClass[tx.status] ?? "s-incomplete"}`} style={{ marginLeft: "auto" }}>
              <span className="status-pill-dot" />
              {tx.status.replace(/_/g, " ")}
            </div>
          )}
        </div>

        {/* ══ STEP: form ══ */}
        {step === "form" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field-label">Monto</label>
              <div className="field-input-wrap">
                <input
                  className="field-input"
                  type="number"
                  min={10}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  style={{ paddingRight: 50 }}
                />
                <span className="field-unit">MXN</span>
              </div>
              <span className="field-hint">Mínimo $10 MXN · Testnet</span>
            </div>

            {!isDeposit && (
              <div className="field">
                <label className="field-label">CLABE destino</label>
                <input
                  className="field-input"
                  type="text"
                  maxLength={18}
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value.replace(/\D/g, ""))}
                  placeholder="646180157000000004"
                />
                <span className="field-hint">18 dígitos · SPEI interbancario · Demo: <button type="button" style={{background:"none",border:"none",color:"var(--gold)",cursor:"pointer",font:"inherit",padding:0,fontSize:".7rem"}} onClick={() => setClabe("646180157000000004")}>usar CLABE de prueba</button></span>
              </div>
            )}

            {err && (
              <div className="err-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {err}
              </div>
            )}

            <button className="btn btn-gold" onClick={handleQuote} disabled={loading}>
              {loading ? <><span className="spin" />Cotizando...</> : <>Ver cotización →</>}
            </button>
          </div>
        )}

        {/* ══ STEP: quote ══ */}
        {step === "quote" && quote && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="swap-from">
                <span className="swap-cur">Envías · MXN</span>
                <span className="swap-amt">{parseFloat(quote.sell_amount).toFixed(2)}</span>
              </div>
              <div className="swap-chevron" style={{ display: "flex", alignItems: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div className="swap-to">
                <span className="swap-cur">Recibes · TMXN</span>
                <span className="swap-amt" style={{ color: "var(--success)" }}>{parseFloat(quote.buy_amount).toFixed(4)}</span>
              </div>
            </div>

            <div className="quote-card">
              <div className="q-row">
                <span className="q-label">Precio</span>
                <span className="q-val">1 TMXN = 1 MXN</span>
              </div>
              <div className="q-row">
                <span className="q-label">Comisión</span>
                <span className="q-val muted">{parseFloat(quote.fee).toFixed(4)} TMXN</span>
              </div>
              {quote.expires_at && (
                <div className="q-row">
                  <span className="q-label">Cotización válida hasta</span>
                  <span className="q-val muted">{new Date(quote.expires_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
            </div>

            {err && (
              <div className="err-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {err}
              </div>
            )}

            <button className="btn btn-gold" onClick={handleConfirm} disabled={loading}>
              {loading ? <><span className="spin" />Iniciando...</> : "Confirmar operación →"}
            </button>
            <button className="btn btn-ghost" onClick={() => setStep("form")}>
              ← Volver
            </button>
          </div>
        )}

        {/* ══ STEP: instructions ══ */}
        {step === "instructions" && instructions && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isDeposit && depInstr ? (
              <>
                <div className="instr-card">
                  <div className="instr-row">
                    <span className="instr-key">CLABE</span>
                    <div className="instr-val-wrap">
                      <span className="instr-val">{depInstr.clabe}</span>
                      <button className={`copy-btn ${copied === "clabe" ? "ok" : ""}`} onClick={() => copy(depInstr.clabe, "clabe")}>
                        {copied === "clabe" ? "✓ Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="instr-row">
                    <span className="instr-key">Referencia</span>
                    <div className="instr-val-wrap">
                      <span className="instr-val">{depInstr.reference}</span>
                      <button className={`copy-btn ${copied === "ref" ? "ok" : ""}`} onClick={() => copy(depInstr.reference, "ref")}>
                        {copied === "ref" ? "✓ Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="instr-row">
                    <span className="instr-key">Banco</span>
                    <span className="instr-val">{depInstr.bank_name}</span>
                  </div>
                  <div className="instr-row">
                    <span className="instr-key">Beneficiario</span>
                    <span className="instr-val" style={{ fontSize: "0.72rem" }}>{depInstr.beneficiary}</span>
                  </div>
                </div>

                <div className="instr-hint">
                  Transfiere el monto exacto via SPEI con la referencia indicada. SEPuente detectará el pago y acreditará TMXN en tu wallet Stellar.
                </div>

                <button className="btn btn-simulate" onClick={handleSimulate} disabled={simulating}>
                  {simulating
                    ? <><span className="spin" />Simulando SPEI...</>
                    : <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        Simular SPEI recibido (sandbox)
                      </>
                  }
                </button>
              </>
            ) : wdInstr ? (
              <>
                <div className="instr-card">
                  <div className="instr-row">
                    <span className="instr-key">Cuenta Stellar</span>
                    <div className="instr-val-wrap">
                      <span className="instr-val" style={{ fontSize: "0.68rem" }}>{wdInstr.anchor_account.slice(0, 12)}…{wdInstr.anchor_account.slice(-8)}</span>
                      <button className={`copy-btn ${copied === "acc" ? "ok" : ""}`} onClick={() => copy(wdInstr.anchor_account, "acc")}>
                        {copied === "acc" ? "✓" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  <div className="instr-row">
                    <span className="instr-key">Memo ({wdInstr.anchor_memo_type})</span>
                    <div className="instr-val-wrap">
                      <span className="instr-val">{wdInstr.anchor_memo}</span>
                      <button className={`copy-btn ${copied === "memo" ? "ok" : ""}`} onClick={() => copy(wdInstr.anchor_memo, "memo")}>
                        {copied === "memo" ? "✓" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="instr-hint">
                  Envía {amount} TMXN a la cuenta y memo indicados. El anchor procesará el pago SPEI a tu CLABE en un máximo de 2 minutos.
                </div>
              </>
            ) : null}

            <div className="polling">
              <div className="poll-dot" />
              Monitoreando estado de la transacción...
            </div>

            {err && (
              <div className="err-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {err}
              </div>
            )}
          </div>
        )}

        {/* ══ STEP: done ══ */}
        {step === "done" && tx && (
          <div className="fade-up">
            {tx.status === "completed" ? (
              <div className="done-wrap">
                <div className="done-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div className="done-title">
                  {isDeposit ? "TMXN acreditado" : "SPEI enviado"}
                </div>
                <div className="done-sub">
                  {isDeposit
                    ? "Los tokens TMXN ya están en tu wallet Stellar. Puedes verificar la transacción en el explorador."
                    : "El pago SPEI fue procesado. Revisa tu cuenta bancaria en los próximos minutos."}
                </div>
                {tx.stellar_transaction_id && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.stellar_transaction_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="done-link"
                  >
                    Ver en stellar.expert
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                )}
                <button className="btn btn-close" style={{ marginTop: 8 }} onClick={() => window.close()}>
                  Cerrar ventana
                </button>
              </div>
            ) : (
              <div className="err-wrap">
                <div className="err-icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "var(--cream)", letterSpacing: "-0.02em" }}>
                  {tx.status === "expired" ? "Transacción expirada" : "Error en la operación"}
                </div>
                {tx.error_message && (
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center" }}>{tx.error_message}</div>
                )}
                <button className="btn btn-ghost" onClick={() => { setStep("form"); setTx(null); setInstructions(null); setQuote(null); }}>
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}

export default function InteractivePage() {
  return (
    <Suspense fallback={
      <>
        <style>{`body{background:#0A1A33;color:#E8E2D5;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", color: "#8B9BB5" }}>
          <div style={{ width:14,height:14,borderRadius:"50%",border:"2px solid #C9A227",borderRightColor:"transparent",animation:"spin 0.7s linear infinite" }} />
          Cargando...
        </div>
      </>
    }>
      <InteractiveContent />
    </Suspense>
  );
}
