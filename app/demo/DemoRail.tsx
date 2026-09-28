"use client";
import { motion, useReducedMotion } from "motion/react";
import styles from "./DemoRail.module.css";

interface Item { label: string; sub: string; target: string }

/**
 * Riel de progreso de la demo: dónde vas (wallet → pesos → conexión → operar).
 * Cada parada lleva a su sección; la línea se llena con resorte al avanzar.
 */
export function DemoRail({ step, isEmail, ops }: { step: number; isEmail: boolean; ops: number }) {
  const reduce = useReducedMotion();
  const items: Item[] = [
    { label: isEmail ? "Correo" : "Saldo", sub: isEmail ? "Pollar" : "Faucet", target: "steps-title" },
    { label: "Pesos", sub: "TMXN", target: "steps-title" },
    { label: "Conexión", sub: "SEP-10", target: "steps-title" },
    { label: "Operar", sub: ops ? `${ops} hecha${ops === 1 ? "" : "s"}` : "SEP-24", target: "ops-title" },
  ];
  const current = Math.min(step, 4) - 1; // 0..3
  const fill = step >= 4 ? (ops ? 1 : 0.84) : current / (items.length - 1);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  return (
    <nav className={styles.rail} aria-label="Tu progreso en la demo">
      <div className={styles.track} aria-hidden="true">
        <motion.span
          className={styles.fill}
          initial={false}
          animate={{ scaleX: fill }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
      <ol className={styles.stops}>
        {items.map((it, i) => {
          const done = i < current || (i === 3 && ops > 0);
          const active = i === current && !done;
          return (
            <li key={it.label}>
              <button
                type="button"
                className={styles.stop}
                data-state={done ? "done" : active ? "active" : "todo"}
                aria-current={active ? "step" : undefined}
                onClick={() => go(it.target)}
              >
                <span className={styles.dot}>
                  {done ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                    </svg>
                  ) : i + 1}
                  {active && !reduce && <motion.span layoutId="rail-halo" className={styles.halo} transition={{ type: "spring", stiffness: 300, damping: 26 }} />}
                </span>
                <span className={styles.text}>
                  <strong>{it.label}</strong>
                  <span>{it.sub}</span>
                </span>
                <span className="sr-only">{done ? "completado" : active ? "paso actual" : "pendiente"}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
