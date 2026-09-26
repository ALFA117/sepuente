import Link from "next/link";
import styles from "./landing.module.css";
import { SiteHeader, SiteFooter } from "./components/SiteHeader";

const FEATURES = [
  {
    title: "Sin custodia",
    desc: "SEPuente nunca toca llaves privadas. Cada pago lo firma la wallet del usuario.",
    icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  },
  {
    title: "Cualquier wallet",
    desc: "Compatible con toda wallet Stellar que implemente SEP-24. Interoperable por diseño.",
    icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  },
  {
    title: "Serverless",
    desc: "Rutas de Next.js en Vercel + Supabase. Sin servidores que mantener.",
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  },
  {
    title: "Open source",
    desc: "Licencia MIT. Haz fork, extiéndelo e integra tu propio driver de fiat.",
    icon: <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />,
  },
  {
    title: "Driver intercambiable",
    desc: "Interfaz RampDriver para conectar Etherfuse, STP o cualquier proveedor SPEI.",
    icon: <path d="M12 22v-5M9 7V2M15 7V2M12 17a5 5 0 0 0 5-5V7H7v5a5 5 0 0 0 5 5z" />,
  },
  {
    title: "Estándar Stellar",
    desc: "SEP-1 · SEP-10 · SEP-24 · SEP-38 implementados como referencia completa.",
    icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  },
];

const FLOW = [
  { n: "01", title: "Fondea tu wallet", desc: "Genera una llave Stellar y obtén XLM de testnet con el faucet integrado." },
  { n: "02", title: "Trustline TMXN", desc: "Firma changeTrust para poder recibir el token de pesos." },
  { n: "03", title: "Auth SEP-10", desc: "Firma el challenge del anchor; el JWT resultante autoriza tus operaciones." },
  { n: "04", title: "Deposita o retira", desc: "SPEI → TMXN o TMXN → SPEI con el flujo interactivo SEP-24." },
];

const PROTOCOLS = [
  { n: "SEP-1", name: "stellar.toml", href: "/.well-known/stellar.toml" },
  { n: "SEP-10", name: "Web Auth" },
  { n: "SEP-24", name: "Depósitos y retiros interactivos" },
  { n: "SEP-38", name: "Cotizaciones (RFQ)" },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <SiteHeader badge="Testnet" />

      <main id="main">
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.chip}>
              <span className={styles.chipDot} aria-hidden="true" />
              Stellar Testnet · SEP-24
            </p>
            <h1 className={styles.title}>
              Pesos mexicanos en Stellar, <span className={styles.titleAccent}>sin custodia</span>
            </h1>
            <p className={styles.lead}>
              <strong>SEPuente</strong> es un anchor SEP-24 open source: conecta SPEI con el token TMXN para que cualquier wallet Stellar deposite y retire pesos.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/demo" className={styles.ctaPrimary}>
                Probar la demo
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <div className={styles.ctaSecondaryRow}>
                <a href="/devs" className={styles.ctaGhost}>Documentación</a>
                <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.ctaGhost}>GitHub</a>
              </div>
            </div>

            <dl className={styles.stats}>
              <div className={styles.stat}><dt>SEPs implementados</dt><dd>4</dd></div>
              <div className={styles.stat}><dt>Fondos en custodia</dt><dd className={styles.statGreen}>$0</dd></div>
              <div className={styles.stat}><dt>Comisión</dt><dd>0.5&nbsp;%</dd></div>
            </dl>
          </div>
        </section>

        {/* ── Características ── */}
        <section className={styles.section} aria-labelledby="features-title">
          <div className={styles.sectionInner}>
            <p className={styles.eyebrow}>Protocolo</p>
            <h2 id="features-title" className={styles.h2}>Infraestructura abierta para el peso en Stellar</h2>
            <ul className={styles.featureGrid}>
              {FEATURES.map((f) => (
                <li key={f.title} className={styles.feature} data-sr>
                  <span className={styles.featureIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                  </span>
                  <h3 className={styles.h3}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Flujo ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="flow-title">
          <div className={styles.sectionInner}>
            <p className={styles.eyebrow}>Flujo completo</p>
            <h2 id="flow-title" className={styles.h2}>De pesos a Stellar en 4 pasos</h2>
            <ol className={styles.flow}>
              {FLOW.map((s) => (
                <li key={s.n} className={styles.flowStep} data-sr>
                  <span className={styles.flowNum}>{s.n}</span>
                  <div>
                    <h3 className={styles.h3}>{s.title}</h3>
                    <p className={styles.featureDesc}>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Arquitectura ── */}
        <section className={styles.section} aria-labelledby="arch-title">
          <div className={styles.sectionInner}>
            <p className={styles.eyebrow}>Arquitectura</p>
            <h2 id="arch-title" className={styles.h2}>Cómo fluye el protocolo</h2>
            <p className={styles.sectionLead}>SEPuente actúa como adaptador sin custodia entre el sistema bancario mexicano y la red Stellar.</p>

            <div className={styles.arch} role="img" aria-label="La wallet habla con SEPuente por SEP-10 y SEP-24; SEPuente conecta con SPEI mediante un driver y con Stellar para mover TMXN.">
              <div className={`${styles.node} ${styles.nodeInfo}`}>
                <span className={styles.nodeTitle}>Wallet</span>
                <span className={styles.nodeSub}>Firma con su propia llave</span>
              </div>
              <div className={styles.link}><span>SEP-10 JWT · SEP-24</span></div>
              <div className={`${styles.node} ${styles.nodeGold}`}>
                <span className={styles.nodeTitle}>SEPuente</span>
                <span className={styles.nodeSub}>Anchor · no custodial</span>
              </div>
              <div className={styles.archSplit}>
                <div className={styles.archBranch}>
                  <div className={styles.link}><span>Driver SPEI</span></div>
                  <div className={`${styles.node} ${styles.nodeMuted}`}>
                    <span className={styles.nodeTitle}>SPEI</span>
                    <span className={styles.nodeSub}>Etherfuse · Mock (demo)</span>
                  </div>
                </div>
                <div className={styles.archBranch}>
                  <div className={styles.link}><span>Pagos TMXN</span></div>
                  <div className={`${styles.node} ${styles.nodeSuccess}`}>
                    <span className={styles.nodeTitle}>Stellar</span>
                    <span className={styles.nodeSub}>Testnet · Horizon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Protocolos ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="proto-title">
          <div className={styles.sectionInner}>
            <p className={styles.eyebrow}>Estándares implementados</p>
            <h2 id="proto-title" className={styles.h2}>Stack SEP completo</h2>
            <ul className={styles.protoGrid}>
              {PROTOCOLS.map((p) => (
                <li key={p.n} className={styles.proto}>
                  <span className={styles.protoNum}>{p.n}</span>
                  {p.href
                    ? <a href={p.href} className={styles.protoName} target="_blank" rel="noreferrer">{p.name}</a>
                    : <span className={styles.protoName}>{p.name}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <h2 className={styles.h2}>Pruébalo ahora</h2>
            <p className={styles.sectionLead}>Wallet de testnet con faucet integrado. Sin registro, sin custodia, en menos de dos minutos.</p>
            <Link href="/demo" className={styles.ctaPrimary}>
              Abrir la demo
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
