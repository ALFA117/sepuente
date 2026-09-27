"use client";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";

// Tokens de movimiento: un solo ritmo para todo el sitio.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const SPRING_PRESS = { type: "spring", stiffness: 400, damping: 24 } as const;
export const SPRING_PANEL = { type: "spring", stiffness: 300, damping: 28 } as const;

type Tag = "div" | "section" | "li" | "ul" | "ol" | "dl" | "p" | "h1" | "h2" | "span" | "article";

/** Aparece al entrar en pantalla. En reposo (sin JS o reduced-motion) el contenido ya es visible. */
export function Reveal({
  as = "div",
  delay = 0,
  y = 18,
  children,
  ...rest
}: { as?: Tag; delay?: number; y?: number } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduce) return <M {...rest}>{children}</M>;
  return (
    <M
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </M>
  );
}

const staggerParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

export function Stagger({ as = "div", children, ...rest }: { as?: Tag } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduce) return <M {...rest}>{children}</M>;
  return (
    <M variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -40px 0px" }} {...rest}>
      {children}
    </M>
  );
}

export function StaggerItem({ as = "div", children, ...rest }: { as?: Tag } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return <M variants={reduce ? undefined : staggerChild} {...rest}>{children}</M>;
}

/** Entrada inmediata al montar (hero, encabezados de pantalla). */
export function Enter({ as = "div", delay = 0, y = 14, children, ...rest }: { as?: Tag; delay?: number; y?: number } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduce) return <M {...rest}>{children}</M>;
  return (
    <M initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE_OUT, delay }} {...rest}>
      {children}
    </M>
  );
}

/** Tarjeta o botón con feedback de presión: escala sutil, no mueve el layout. */
export function Pressable({ children, ...rest }: HTMLMotionProps<"button">) {
  const reduce = useReducedMotion();
  return (
    <motion.button whileTap={reduce || rest.disabled ? undefined : { scale: 0.97 }} transition={SPRING_PRESS} {...rest}>
      {children}
    </motion.button>
  );
}

/** Cambia de contenido con un fundido corto cuando `k` cambia (saldos, estados, íconos). */
export function Swap({ k, children, className, pop = false }: { k: string | number; children: React.ReactNode; className?: string; pop?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={k}
        className={className}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", maxWidth: "100%" }}
        initial={reduce ? { opacity: 0 } : pop ? { opacity: 0, scale: 0.4 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : pop ? { opacity: 0, scale: 0.6 } : { opacity: 0, y: -6 }}
        transition={reduce ? { duration: 0 } : pop ? { type: "spring", stiffness: 420, damping: 20 } : { duration: 0.18, ease: EASE_OUT }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

/** Check que se dibuja: confirma visualmente una acción completada. */
export function DrawCheck({ size = 30 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.15 }}
      />
    </svg>
  );
}
