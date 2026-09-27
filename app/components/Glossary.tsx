import styles from "./Glossary.module.css";

const TERMS = [
  { t: "Stellar", d: "Una red pública para mover dinero digital en segundos, con comisiones de fracciones de centavo." },
  { t: "XLM", d: "La moneda propia de Stellar. No se convierte en pesos: solo paga la comisión de la red, 0.00001 XLM por movimiento. Por eso tus 10,000 XLM casi no cambian." },
  { t: "TMXN", d: "Peso mexicano digital de prueba: 1 TMXN equivale a 1 peso. Se escribe T-M-X-N (Test MXN)." },
  { t: "SPEI", d: "El sistema de transferencias entre bancos de México que ya usas en tu app bancaria." },
  { t: "Anchor", d: "El puente entre el banco y Stellar: recibe tu SPEI y te entrega TMXN, o al revés. SEPuente es el anchor." },
  { t: "Comisión del anchor", d: "0.5 % que cobra el anchor en TMXN al depositar o retirar. Si depositas 10 pesos recibes 9.95 TMXN; los XLM no se tocan." },
  { t: "Wallet", d: "La app donde guardas tus TMXN. Solo tú tienes la llave; SEPuente nunca la ve." },
  { t: "Trustline", d: "Un permiso que das en tu wallet para aceptar un token (aquí, TMXN). Se hace una sola vez." },
  { t: "SEP-10 · SEP-24 · SEP-38", d: "Reglas estándar de Stellar para iniciar sesión, depositar/retirar y cotizar. Gracias a ellas cualquier wallet funciona igual." },
  { t: "Testnet", d: "La red de práctica de Stellar: todo es real técnicamente, pero el dinero no tiene valor." },
];

export function Glossary({ compact = false, open = false }: { compact?: boolean; open?: boolean }) {
  return (
    <details className={`${styles.box} ${compact ? styles.compact : ""}`} open={open}>
      <summary className={styles.summary}>
        <span className={styles.q} aria-hidden="true">?</span>
        <span className={styles.sumText}>
          <strong>¿Nuevo en Stellar?</strong>
          <span>Qué significa cada término, en palabras simples</span>
        </span>
        <svg className={styles.chev} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <dl className={styles.list}>
        {TERMS.map((x) => (
          <div key={x.t} className={styles.item}>
            <dt>{x.t}</dt>
            <dd>{x.d}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Nombre del token con fuente de texto (no mono) para que la "M" no se confunda con una "H". */
export function Token({ children = "TMXN" }: { children?: string }) {
  return <span className={styles.token}>{children}</span>;
}
