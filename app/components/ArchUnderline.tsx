"use client";
import { motion, useReducedMotion } from "motion/react";

/** Arco de puente que se dibuja bajo una palabra del título (mismo gesto que el logo). */
export function ArchUnderline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const draw = (delay: number) =>
    reduce ? { initial: false as const } : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const } };
  return (
    <svg className={className} viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
      <motion.path d="M4 34 Q150 -10 296 34" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" {...draw(0.45)} />
      <motion.path d="M2 36 H298" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" {...draw(0.35)} />
      {[60, 105, 150, 195, 240].map((x, i) => {
        const y = 34 - 44 * (1 - Math.pow((x - 150) / 146, 2)) * 0.5;
        return <motion.path key={x} d={`M${x} 36 V${y.toFixed(1)}`} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" {...draw(0.9 + i * 0.05)} />;
      })}
    </svg>
  );
}
