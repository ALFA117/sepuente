"use client";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ui from "./ui.module.css";
import { txStatus } from "@/lib/status";

export { ui };

export const Icon = {
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
  ),
  alert: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
  ),
  flask: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7 15h10" /></svg>
  ),
  external: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
  ),
  copy: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
  ),
  down: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v14M5 12l7 7 7-7" /></svg>
  ),
  up: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V6M5 12l7-7 7 7" /></svg>
  ),
  refresh: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
  ),
  x: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
  ),
  arrow: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
};

export function Spinner({ label }: { label?: string }) {
  return <span className={ui.spinner} role={label ? "status" : undefined} aria-label={label} />;
}

export function StatusBadge({ status }: { status: string }) {
  const s = txStatus(status);
  return <span className={`${ui.badge} ${ui[`tone-${s.tone}`]}`}>{s.label}</span>;
}

export function SandboxNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className={ui.notice} role="note">
      {Icon.flask(16)}
      <span>
        <strong>Modo prueba.</strong>{" "}
        {children ?? "Todo ocurre en Stellar testnet y el SPEI es simulado. No envíes dinero real."}
      </span>
    </div>
  );
}

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button type="button" className={ui.copyBtn} onClick={onCopy} data-copied={copied} aria-label={`${label}: ${copied ? "copiado" : "copiar"}`}>
      {copied ? Icon.check(14) : Icon.copy(14)}
      <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}

export function EmptyState({ title, text, art }: { title: string; text: string; art?: React.ReactNode }) {
  return (
    <div className={ui.empty}>
      <div className={ui.emptyArt} aria-hidden="true">
        {art ?? (
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 44c8-14 18-22 26-22s18 8 26 22" />
            <path d="M6 44h52" />
            <path d="M18 44V33M32 44V22M46 44V33" opacity="0.6" />
          </svg>
        )}
      </div>
      <div className={ui.emptyTitle}>{title}</div>
      <p className={ui.emptyText}>{text}</p>
    </div>
  );
}

type Toast = { id: number; kind: "success" | "error"; msg: string };

export function useToasts() {
  const reduce = useReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Toast["kind"], msg: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, kind, msg }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4500);
  }, [dismiss]);

  const view = (
    <div className={ui.toasts} aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduce}
            className={`${ui.toast} ${t.kind === "success" ? ui.toastSuccess : ui.toastError}`}
            role={t.kind === "error" ? "alert" : "status"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }}
          >
            {t.kind === "success" ? Icon.check(16) : Icon.alert(16)}
            <span className={ui.toastMsg}>{t.msg}</span>
            <button type="button" className={ui.toastClose} onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">{Icon.x(14)}</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return {
    success: (m: string) => push("success", m),
    error: (m: string) => push("error", m),
    view,
  };
}
