import Link from "next/link";
import styles from "./landing.module.css";
import { SiteHeader, SiteFooter } from "./components/SiteHeader";
import { Reveal, Stagger, StaggerItem, Enter } from "./components/motion";
import { TransferPreview } from "./components/TransferPreview";
import { Glossary } from "./components/Glossary";
import { Logo3D } from "./components/brand/Logo3D";
import { ArchFlow } from "./components/ArchFlow";
import { LogoWord } from "./components/brand/Logo";

const SIMPLE = [
  { t: "Mandas pesos desde tu banco", d: "Haces una transferencia SPEI normal, como a cualquier cuenta." },
  { t: "Recibes pesos digitales", d: "El anchor te entrega la misma cantidad en TMXN (1 TMXN = 1 peso) en tu wallet de Stellar, menos una comisión de 0.5 %." },
  { t: "Los usas o regresas a tu banco", d: "Cuando quieras, envías tus TMXN de vuelta y recibes pesos en tu CLABE. Tú firmas cada movimiento." },
];

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
            <Enter className={styles.brand} y={20}>
              <Logo3D className={styles.brand3d} />
              <LogoWord className={styles.brandWord} />
            </Enter>
            <div className={styles.heroCopy}>
              <Enter as="p" className={styles.chip}>
                <span className={styles.chipDot} aria-hidden="true" />
                Demo en vivo · red de prueba
              </Enter>
              <Enter as="h1" className={styles.title} delay={0.06}>
                Pesos mexicanos en Stellar, <span className={styles.titleAccent}>sin custodia</span>
              </Enter>
              <Enter as="p" className={styles.lead} delay={0.12}>
                Manda pesos desde tu banco y recíbelos como <strong>pesos digitales</strong> en cualquier wallet de Stellar, y regrésalos a tu cuenta cuando quieras. <strong>SEPuente</strong> es el puente abierto entre SPEI y Stellar, y nunca guarda tu dinero.
              </Enter>
              <Enter className={styles.ctaRow} delay={0.18}>
                <Link href="/demo" className={styles.ctaPrimary}>
                  Probar la demo
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
                <div className={styles.ctaSecondaryRow}>
                  <a href="/devs" className={styles.ctaGhost}>Documentación</a>
                  <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.ctaGhost}>GitHub</a>
                </div>
              </Enter>
            </div>

            <Enter className={styles.heroVisual} delay={0.28} y={24}>
              <TransferPreview />
            </Enter>

            <Enter as="dl" className={styles.stats} delay={0.34}>
              <div className={styles.stat}><dt>SEPs implementados</dt><dd>4</dd></div>
              <div className={styles.stat}><dt>Fondos en custodia</dt><dd className={styles.statGreen}>$0</dd></div>
              <div className={styles.stat}><dt>Comisión</dt><dd>0.5&nbsp;%</dd></div>
            </Enter>
          </div>
        </section>

        {/* ── En palabras simples ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="simple-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>En palabras simples</Reveal>
            <Reveal as="h2" id="simple-title" className={styles.h2} delay={0.05}>Tu banco y tu wallet, conectados</Reveal>
            <Stagger as="ol" className={styles.simple}>
              {SIMPLE.map((s, i) => (
                <StaggerItem as="li" key={s.t} className={styles.simpleStep}>
                  <span className={styles.simpleNum}>{i + 1}</span>
                  <div>
                    <h3 className={styles.h3}>{s.t}</h3>
                    <p className={styles.featureDesc}>{s.d}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal><Glossary /></Reveal>
          </div>
        </section>

        {/* ── Características ── */}
        <section className={styles.section} aria-labelledby="features-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>Protocolo</Reveal>
            <Reveal as="h2" id="features-title" className={styles.h2} delay={0.05}>Infraestructura abierta para el peso en Stellar</Reveal>
            <Stagger as="ul" className={styles.featureGrid}>
              {FEATURES.map((f) => (
                <StaggerItem as="li" key={f.title} className={styles.feature}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                  </span>
                  <div className={styles.featureText}>
                    <h3 className={styles.h3}>{f.title}</h3>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ── Flujo ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="flow-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>Flujo completo</Reveal>
            <Reveal as="h2" id="flow-title" className={styles.h2} delay={0.05}>De pesos a Stellar en 4 pasos</Reveal>
            <Stagger as="ol" className={styles.flow}>
              {FLOW.map((s) => (
                <StaggerItem as="li" key={s.n} className={styles.flowStep}>
                  <span className={styles.flowNum}>{s.n}</span>
                  <div>
                    <h3 className={styles.h3}>{s.title}</h3>
                    <p className={styles.featureDesc}>{s.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ── Arquitectura ── */}
        <section className={styles.section} aria-labelledby="arch-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>Arquitectura</Reveal>
            <Reveal as="h2" id="arch-title" className={styles.h2} delay={0.05}>Cómo fluye el protocolo</Reveal>
            <Reveal as="p" className={styles.sectionLead} delay={0.1}>SEPuente actúa como adaptador sin custodia entre el sistema bancario mexicano y la red Stellar.</Reveal>

            <Reveal delay={0.1}>
              <ArchFlow />
            </Reveal>
          </div>
        </section>

        {/* ── Protocolos ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="proto-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>Estándares implementados</Reveal>
            <Reveal as="h2" id="proto-title" className={styles.h2} delay={0.05}>Stack SEP completo</Reveal>
            <Stagger as="ul" className={styles.protoGrid}>
              {PROTOCOLS.map((p) => (
                <StaggerItem as="li" key={p.n} className={styles.proto}>
                  <span className={styles.protoNum}>{p.n}</span>
                  {p.href
                    ? <a href={p.href} className={styles.protoName} target="_blank" rel="noreferrer">{p.name}</a>
                    : <span className={styles.protoName}>{p.name}</span>}
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.cta}>
          <Reveal className={styles.ctaInner}>
            <h2 className={styles.h2}>Pruébalo ahora</h2>
            <p className={styles.sectionLead}>Wallet de testnet con faucet integrado. Sin registro, sin custodia, en menos de dos minutos.</p>
            <Link href="/demo" className={styles.ctaPrimary}>
              Abrir la demo
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
