import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <section className={styles.hero}>
        {/* Animated background */}
        <div className={styles.heroBg}>
          <div className={styles.grid} />
        </div>

        <div className={styles.heroContent}>
          {/* Symbol */}
          <div className={styles.symbolWrap}>
            <span className={styles.symbol}>⟴</span>
          </div>

          {/* Title */}
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>SEPuente</h1>
          </div>

          {/* Tagline */}
          <p className={styles.tagline}>
            Anchor <span className={styles.taglineAccent}>SEP-24</span> no custodial
            {" · "}Pesos mexicanos en Stellar
          </p>

          <div className={styles.separator} />

          {/* Pills */}
          <div className={styles.pills}>
            <span className={`${styles.pill} ${styles.pillGold}`}>Sin custodia</span>
            <span className={`${styles.pill} ${styles.pillGreen}`}>Open source</span>
            <span className={`${styles.pill} ${styles.pillBlue}`}>Serverless</span>
            <span className={`${styles.pill} ${styles.pillGrey}`}>Testnet</span>
          </div>

          {/* CTAs */}
          <div className={styles.ctaRow}>
            <Link href="/demo" className={styles.ctaPrimary}>
              Probar Demo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a
              href="https://github.com/ALFA117/sepuente"
              target="_blank"
              rel="noreferrer"
              className={styles.ctaSecondary}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
            <a
              href="/pitch.html"
              className={styles.ctaSecondary}
            >
              Ver Pitch
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2.5l4.5 4.5L7 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className={styles.scrollHint}>
          <div className={styles.scrollHintLine} />
          <span className={styles.scrollHintText}>scroll</span>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className={styles.sectionLabel}>Protocolo</div>
        <h2 className={styles.sectionTitle}>
          Infraestructura abierta para el peso en Stellar
        </h2>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🔐</span>
            <div className={styles.featureName}>Sin custodia</div>
            <p className={styles.featureDesc}>
              SEPuente nunca toca llaves privadas de usuarios. El protocolo solo facilita el intercambio.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🌐</span>
            <div className={styles.featureName}>Cualquier wallet</div>
            <p className={styles.featureDesc}>
              Compatible con cualquier wallet Stellar que implemente SEP-24. Interoperable por diseño.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>⚡</span>
            <div className={styles.featureName}>Serverless</div>
            <p className={styles.featureDesc}>
              Sin servidores propios. Corre en Vercel Edge + Supabase. Zero infraestructura que mantener.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🏗️</span>
            <div className={styles.featureName}>Open source</div>
            <p className={styles.featureDesc}>
              MIT License. Fork, extiende, integra tu propio driver de fiat. Código auditable.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🔄</span>
            <div className={styles.featureName}>Plug & play driver</div>
            <p className={styles.featureDesc}>
              Interface <code>RampDriver</code> para conectar cualquier proveedor de ramp (Etherfuse, STP, SPEI).
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📋</span>
            <div className={styles.featureName}>Estándar Stellar</div>
            <p className={styles.featureDesc}>
              SEP-1 · SEP-10 · SEP-24 · SEP-38. Implementación de referencia completa del ecosistema.
            </p>
          </div>
        </div>
      </section>

      {/* ── PROTOCOLS ── */}
      <section className={styles.protocols}>
        <div className={styles.sectionLabel}>Estándares implementados</div>
        <div className={styles.protocolRow}>
          <div className={styles.protocolBadge}>
            <span className={styles.protocolNum}>SEP-1</span>
            <span className={styles.protocolName}>stellar.toml</span>
          </div>
          <div className={styles.protocolBadge}>
            <span className={styles.protocolNum}>SEP-10</span>
            <span className={styles.protocolName}>Web Auth</span>
          </div>
          <div className={styles.protocolBadge}>
            <span className={styles.protocolNum}>SEP-24</span>
            <span className={styles.protocolName}>Hosted Deposit & Withdrawal</span>
          </div>
          <div className={styles.protocolBadge}>
            <span className={styles.protocolNum}>SEP-38</span>
            <span className={styles.protocolName}>Anchor RFQ</span>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaSectionTitle}>Pruébalo ahora</h2>
        <p className={styles.ctaSectionSub}>
          Wallet testnet con faucet integrado. Genera una cuenta, fondéala y prueba el flujo SEP-24 completo.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/demo" className={styles.ctaPrimary}>
            Abrir Demo
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <a href="/devs" className={styles.footerLink}>Docs para devs</a>
        <span className={styles.footerDot}>·</span>
        <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.footerLink}>GitHub</a>
        <span className={styles.footerDot}>·</span>
        <a href="/pitch.html" className={styles.footerLink}>Pitch</a>
        <span className={styles.footerDot}>·</span>
        <span className={styles.footerBadge}>Stellar Testnet · SEP-24</span>
      </footer>
    </div>
  );
}
