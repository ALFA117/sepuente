import { MARK, WORD } from "./paths";
import styles from "./Logo.module.css";

type Props = { className?: string; title?: string };

/**
 * Símbolo del puente (vector). Toma el color de `currentColor`.
 * `bold` añade un contorno del mismo color para que las líneas finas se lean en tamaños pequeños.
 */
export function LogoMark({ className, title, bold = false }: Props & { bold?: boolean }) {
  return (
    <svg
      className={className}
      viewBox={`-12 -12 ${MARK.w + 24} ${MARK.h + 24}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d={MARK.d}
        {...(bold ? { stroke: "currentColor", strokeWidth: 18, strokeLinejoin: "round" as const } : {})}
      />
    </svg>
  );
}

/** Texto "SEPuente" trazado del logo original. */
export function LogoWord({ className, title }: Props) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${WORD.w} ${WORD.h}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={WORD.d} />
    </svg>
  );
}

/** Composición horizontal: símbolo + texto (encabezado y pie). */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={`${styles.lockup} ${className ?? ""}`}>
      <LogoMark className={styles.lockMark} bold />
      <LogoWord className={styles.lockWord} />
      <span className="sr-only">SEPuente</span>
    </span>
  );
}

/** Composición apilada, como el logo original. */
export function LogoStacked({ className }: { className?: string }) {
  return (
    <span className={`${styles.stacked} ${className ?? ""}`} role="img" aria-label="SEPuente">
      <LogoMark className={styles.stackMark} />
      <LogoWord className={styles.stackWord} />
    </span>
  );
}
