import Link from "next/link";
import { SiteHeader, SiteFooter } from "./components/SiteHeader";
import ui from "./components/ui.module.css";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main id="main" className={styles.main}>
        <svg className={styles.art} width="120" height="72" viewBox="0 0 120 72" fill="none" aria-hidden="true">
          <path d="M6 60c14-26 32-40 50-40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M72 22c16 4 30 18 42 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" opacity="0.5" />
          <path d="M6 60h40M74 60h40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Este puente no llega a ningún lado</h1>
        <p className={styles.text}>La página no existe o fue movida. Regresa al inicio o prueba la wallet demo.</p>
        <div className={styles.actions}>
          <Link href="/" className={`${ui.btn} ${ui.primary}`}>Ir al inicio</Link>
          <Link href="/demo" className={`${ui.btn} ${ui.secondary}`}>Abrir demo</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
