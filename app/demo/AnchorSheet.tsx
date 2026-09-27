"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./AnchorSheet.module.css";
import { Icon } from "../components/ui";
import { EASE_OUT } from "../components/motion";

export interface SheetState {
  url: string;
  kind: "deposit" | "withdraw";
  id: string;
}

/**
 * La pantalla SEP-24 del anchor se muestra dentro de la wallet (iframe, como permite el estándar),
 * así el usuario nunca sale de la app. El anchor y la wallet hablan por postMessage.
 */
export function AnchorSheet({
  sheet,
  onClose,
  iframeRef,
}: {
  sheet: SheetState | null;
  onClose: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sheet) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      returnFocus.current?.focus?.();
    };
  }, [sheet, onClose]);

  const isDeposit = sheet?.kind === "deposit";

  return (
    <AnimatePresence>
      {sheet && (
        <motion.div
          className={styles.scrim}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            initial={reduce ? { opacity: 0 } : { y: "8%", opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "6%", opacity: 0, scale: 0.98, transition: { duration: 0.16, ease: EASE_OUT } }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
          >
            <header className={styles.head}>
              <span className={`${styles.icon} ${isDeposit ? styles.dep : styles.wd}`} aria-hidden="true">
                {isDeposit ? Icon.down(18) : Icon.up(18)}
              </span>
              <div className={styles.titles}>
                <h2 id="sheet-title" className={styles.title}>{isDeposit ? "Depositar pesos" : "Retirar pesos"}</h2>
                <p className={styles.sub}>Anchor SEPuente · en tu wallet</p>
              </div>
              <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Cerrar y volver a la wallet">
                {Icon.x(18)}
              </button>
            </header>
            <iframe
              ref={iframeRef}
              className={styles.frame}
              src={sheet.url}
              title={isDeposit ? "Depósito con el anchor SEPuente" : "Retiro con el anchor SEPuente"}
              allow="clipboard-write"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
