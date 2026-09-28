"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import styles from "./ArchFlow.module.css";
import { EASE_OUT } from "./motion";

type NodeId = "wallet" | "anchor" | "bank" | "stellar";
type EdgeId = "wallet-anchor" | "bank-anchor" | "anchor-stellar" | "stellar-wallet";
type Mode = "deposit" | "withdraw";

interface Step { edge: EdgeId; from: NodeId; to: NodeId; tag: string; title: string; desc: string }

const STEPS: Record<Mode, Step[]> = {
  deposit: [
    { edge: "wallet-anchor", from: "wallet", to: "anchor", tag: "SEP-10", title: "Tu wallet inicia sesión", desc: "Firma un reto con su llave. Sin contraseñas y sin entregar la llave." },
    { edge: "wallet-anchor", from: "anchor", to: "wallet", tag: "SEP-24 · SEP-38", title: "Ves la cotización", desc: "El anchor muestra cuánto recibirás y la comisión de 0.5 %." },
    { edge: "bank-anchor", from: "bank", to: "anchor", tag: "SPEI", title: "Transfieres pesos", desc: "Una transferencia SPEI normal desde tu banco, con la referencia indicada." },
    { edge: "anchor-stellar", from: "anchor", to: "stellar", tag: "Pago TMXN", title: "El anchor emite el pago", desc: "Envía TMXN (1 = 1 peso) por la red Stellar." },
    { edge: "stellar-wallet", from: "stellar", to: "wallet", tag: "≈ 5 s", title: "Los pesos llegan a tu wallet", desc: "Verificable en el explorador. SEPuente nunca custodió el dinero." },
  ],
  withdraw: [
    { edge: "wallet-anchor", from: "wallet", to: "anchor", tag: "SEP-10", title: "Tu wallet inicia sesión", desc: "Firma un reto con su llave. Sin contraseñas y sin entregar la llave." },
    { edge: "wallet-anchor", from: "anchor", to: "wallet", tag: "SEP-24 · SEP-38", title: "Pides retirar a tu CLABE", desc: "El anchor cotiza y te da una cuenta Stellar y un memo." },
    { edge: "stellar-wallet", from: "wallet", to: "stellar", tag: "Pago TMXN", title: "Tu wallet firma el pago", desc: "Tú envías los TMXN; el anchor jamás toca tus llaves." },
    { edge: "anchor-stellar", from: "stellar", to: "anchor", tag: "Horizon", title: "El anchor detecta el pago", desc: "Lo confirma en la red usando el memo de tu operación." },
    { edge: "bank-anchor", from: "anchor", to: "bank", tag: "SPEI", title: "Pesos a tu cuenta", desc: "Se envía el SPEI a tu CLABE (simulado en esta demo)." },
  ],
};

const NODES: Record<NodeId, { label: string; sub: string }> = {
  wallet: { label: "Tu wallet", sub: "Tu llave, tu dinero" },
  anchor: { label: "SEPuente", sub: "Anchor no custodial" },
  bank: { label: "Tu banco", sub: "SPEI · CLABE" },
  stellar: { label: "Stellar", sub: "Red pública" },
};

// Dos composiciones: vertical (teléfono) y horizontal (escritorio). Las aristas van en el sentido from→to del nombre.
const LAYOUTS = {
  portrait: {
    vb: "0 0 360 470",
    w: 148,
    h: 62,
    nodes: { wallet: [180, 52], anchor: [180, 236], bank: [88, 408], stellar: [272, 408] } as Record<NodeId, [number, number]>,
    edges: {
      "wallet-anchor": "M180 83 L180 205",
      "bank-anchor": "M88 377 C88 322 128 300 150 267",
      "anchor-stellar": "M210 267 C232 300 272 322 272 377",
      "stellar-wallet": "M346 408 C366 300 356 92 254 60",
    } as Record<EdgeId, string>,
  },
  landscape: {
    vb: "0 0 860 330",
    w: 150,
    h: 66,
    nodes: { wallet: [430, 52], anchor: [430, 250], bank: [110, 250], stellar: [750, 250] } as Record<NodeId, [number, number]>,
    edges: {
      "wallet-anchor": "M430 85 L430 217",
      "bank-anchor": "M185 250 L355 250",
      "anchor-stellar": "M505 250 L675 250",
      "stellar-wallet": "M750 217 C750 110 640 52 505 52",
    } as Record<EdgeId, string>,
  },
};

function Diagram({ layout, step, playing, reduce }: { layout: keyof typeof LAYOUTS; step: Step; playing: boolean; reduce: boolean }) {
  const L = LAYOUTS[layout];
  const pathRefs = useRef<Partial<Record<EdgeId, SVGPathElement | null>>>({});
  const dotRef = useRef<SVGGElement>(null);
  const [tagPoint, setTagPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const path = pathRefs.current[step.edge];
    if (!path) return;
    const p = path.getPointAtLength(path.getTotalLength() / 2);
    setTagPoint({ x: p.x, y: p.y });
  }, [step, layout]);

  useEffect(() => {
    const path = pathRefs.current[step.edge];
    const dot = dotRef.current;
    if (!path || !dot) return;
    const len = path.getTotalLength();
    // Cada trazo va en el sentido de su nombre ("bank-anchor" = del banco al anchor); si el paso va al revés, la partícula también.
    const forward = step.edge.split("-")[0] === step.from;
    const place = (v: number) => {
      const p = path.getPointAtLength(len * (forward ? v : 1 - v));
      dot.setAttribute("transform", `translate(${p.x} ${p.y})`);
    };
    if (reduce || !playing) { place(0.5); return; }
    const controls = animate(0, 1, { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.15, onUpdate: place });
    return () => controls.stop();
  }, [step, playing, reduce, layout]);

  return (
    <svg className={`${styles.svg} ${styles[layout]}`} viewBox={L.vb} role="img" aria-label={`${step.title}: ${NODES[step.from].label} hacia ${NODES[step.to].label}`}>
      <defs>
        <radialGradient id={`dotglow-${layout}`}>
          <stop offset="0%" stopColor="var(--gold-hover)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {(Object.keys(L.edges) as EdgeId[]).map((id) => {
        const active = id === step.edge;
        return (
          <g key={id}>
            <path d={L.edges[id]} className={styles.edgeBase} />
            <path
              ref={(el) => { pathRefs.current[id] = el; }}
              d={L.edges[id]}
              className={`${styles.edge} ${active ? styles.edgeActive : ""}`}
            />
          </g>
        );
      })}

      {(Object.keys(L.nodes) as NodeId[]).map((id) => {
        const [x, y] = L.nodes[id];
        const active = id === step.from || id === step.to;
        const isAnchor = id === "anchor";
        return (
          <motion.g
            key={id}
            className={`${styles.node} ${isAnchor ? styles.nodeAnchor : ""} ${active ? styles.nodeActive : ""}`}
            animate={{ scale: active && !reduce ? 1.04 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <rect x={x - L.w / 2} y={y - L.h / 2} width={L.w} height={L.h} rx={14} />
            <text x={x} y={y - 3} className={styles.nodeLabel}>{NODES[id].label}</text>
            <text x={x} y={y + 16} className={styles.nodeSub}>{NODES[id].sub}</text>
          </motion.g>
        );
      })}

      {/* La partícula va antes que la etiqueta para pasar por debajo de ella y no tapar el texto. */}
      <g ref={dotRef} className={styles.dot} aria-hidden="true">
        <circle r={16} fill={`url(#dotglow-${layout})`} />
        <circle r={5.5} className={styles.dotCore} />
      </g>

      {tagPoint && (
        <g transform={`translate(${tagPoint.x} ${tagPoint.y})`} className={styles.tag}>
          <rect x={-(step.tag.length * 3.6 + 12)} y={-12} width={step.tag.length * 7.2 + 24} height={24} rx={12} />
          <text y={4}>{step.tag}</text>
        </g>
      )}
    </svg>
  );
}

export function ArchFlow() {
  const reduce = !!useReducedMotion();
  const [mode, setMode] = useState<Mode>("deposit");
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -80px 0px" });
  const steps = STEPS[mode];
  const step = steps[i];
  const playing = inView && !hover;

  useEffect(() => {
    if (!playing || reduce) return;
    const t = setTimeout(() => setI((n) => (n + 1) % steps.length), 2800);
    return () => clearTimeout(t);
  }, [i, playing, reduce, steps.length]);

  const pickMode = (m: Mode) => { setMode(m); setI(0); };

  return (
    <div
      ref={ref}
      className={styles.wrap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      <div className={styles.toolbar}>
        <div className={styles.modes} role="tablist" aria-label="Tipo de operación">
          {(["deposit", "withdraw"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={styles.modeBtn} onClick={() => pickMode(m)}>
              {mode === m && <motion.span layoutId="arch-mode" className={styles.modePill} transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <span className={styles.modeText}>{m === "deposit" ? "Depósito" : "Retiro"}</span>
            </button>
          ))}
        </div>
        <span className={styles.counter} aria-hidden="true">{i + 1} / {steps.length}</span>
      </div>

      <div className={styles.stage}>
        <Diagram layout="portrait" step={step} playing={playing} reduce={reduce} />
        <Diagram layout="landscape" step={step} playing={playing} reduce={reduce} />
      </div>

      <div className={styles.caption} aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${i}`}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <strong>{step.title}</strong>
            <p>{step.desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <ol className={styles.steps}>
        {steps.map((s, n) => (
          <li key={n}>
            <button
              type="button"
              className={styles.stepBtn}
              aria-current={n === i ? "step" : undefined}
              aria-label={`Paso ${n + 1}: ${s.title}`}
              onClick={() => setI(n)}
            >
              <span className={styles.stepTrack}>
                {n === i && !reduce && playing && (
                  <motion.span key={`${mode}-${i}`} className={styles.stepFill} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.8, ease: "linear" }} />
                )}
                {(n < i || (n === i && (reduce || !playing))) && <span className={`${styles.stepFill} ${styles.stepFillDone}`} />}
              </span>
              <span className={styles.stepNum}>{n + 1}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
