"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./TransferPreview.module.css";
import { EASE_OUT } from "./motion";

// Ilustración del flujo real de la demo: 1,000 MXN − 0.5 % = 995 TMXN.
const STAGES = [
  { label: "Cotización lista", sub: "Vigente 15 min", tone: "info" },
  { label: "SPEI recibido", sub: "Referencia SP7F3A21C0", tone: "warning" },
  { label: "TMXN acreditado", sub: "Stellar testnet", tone: "success" },
] as const;

export function TransferPreview() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(reduce ? 2 : 0);

  useEffect(() => {
    if (reduce) { setStage(2); return; }
    const iv = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2400);
    return () => clearInterval(iv);
  }, [reduce]);

  const s = STAGES[stage];

  return (
    <figure className={styles.card} aria-label="Ilustración de un depósito: envías 1,000 MXN por SPEI y recibes 995 TMXN en Stellar">
      <div className={styles.head}>
        <span className={styles.kind}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v14M5 12l7 7 7-7" /></svg>
          Depósito SEP-24
        </span>
        <span className={styles.net}>testnet</span>
      </div>

      <div className={styles.swap}>
        <div className={styles.side}>
          <span className={styles.lbl}>Envías</span>
          <span className={styles.amt}>1,000.00</span>
          <span className={styles.unit}>MXN · SPEI</span>
        </div>
        <motion.span
          className={styles.arrow}
          aria-hidden="true"
          animate={reduce ? undefined : { x: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </motion.span>
        <div className={`${styles.side} ${styles.right}`}>
          <span className={styles.lbl}>Recibes</span>
          <span className={`${styles.amt} ${styles.out}`}>995.00</span>
          <span className={styles.unit}>TMXN · Stellar</span>
        </div>
      </div>

      <ol className={styles.track} aria-hidden="true">
        {STAGES.map((st, i) => (
          <li key={st.label} className={styles.seg}>
            <motion.span
              className={styles.fill}
              initial={false}
              animate={{ scaleX: i <= stage ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}
            />
          </li>
        ))}
      </ol>

      <div className={styles.status} aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            className={styles.statusRow}
            data-tone={s.tone}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <span className={styles.dot} />
            <span className={styles.statusText}>
              <strong>{s.label}</strong>
              <span>{s.sub}</span>
            </span>
            {stage === 2 && (
              <motion.span
                className={styles.check}
                initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 20 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </motion.span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <figcaption className={styles.caption}>Ilustración · comisión real 0.5 %</figcaption>
    </figure>
  );
}
