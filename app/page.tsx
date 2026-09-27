import Link from "next/link";
import styles from "./landing.module.css";
import { SiteHeader, SiteFooter } from "./components/SiteHeader";
import { Reveal, Stagger, StaggerItem, Enter } from "./components/motion";
import { TransferPreview } from "./components/TransferPreview";
import { Glossary } from "./components/Glossary";
import { Logo3D } from "./components/brand/Logo3D";
import { ArchFlow } from "./components/ArchFlow";
import { LogoWord } from "./components/brand/Logo";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/",
  "SEPuente – Pesos mexicanos en Stellar, sin custodia",
  "Anchor SEP-24 abierto y sin custodia: manda pesos por SPEI y recíbelos como pesos digitales en cualquier wallet de Stellar. SEP-1, SEP-10, SEP-24 y SEP-38.",
);

// Comprobante de ejemplo con la comisión real de 0.5 % por tramo.
const SIMPLE = [
  { t: "Mandas pesos desde tu banco", d: "Una transferencia SPEI normal, como a cualquier cuenta, con la referencia que te da el anchor.", amt: "−1,000.00", unit: "MXN", via: "SPEI", tone: "out" },
  { t: "Recibes pesos digitales", d: "Llegan a tu wallet de Stellar como TMXN (1 TMXN = 1 peso), menos 0.5 % de comisión.", amt: "+995.00", unit: "TMXN", via: "Stellar · ≈ 5 s", tone: "in" },
  { t: "Los regresas a tu banco", d: "Cuando quieras, envías TMXN al anchor y recibes pesos en tu CLABE. Por ejemplo, 500 TMXN:", amt: "+497.50", unit: "MXN", via: "CLABE", tone: "in" },
];

const FEATURES = [
  {
    title: "Sin custodia",
    desc: "SEPuente nunca toca llaves privadas. Cada pago lo firma la wallet del usuario.",
    icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  },
  {
    title: "Cualquier wallet, incluso tu correo",
    desc: "Compatible con toda wallet Stellar que implemente SEP-24. En la demo puedes entrar solo con tu correo gracias a Pollar.",
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
  { n: "01", title: "Entra con tu correo", desc: "Un código de 6 dígitos y Pollar crea tu wallet Stellar, sin XLM. O genera una llave en el navegador.", call: "sendEmailCode(correo)" },
  { n: "02", title: "Activa TMXN", desc: "Tu wallet acepta el token de pesos. Con correo, Pollar paga la comisión de red.", call: "changeTrust(TMXN)" },
  { n: "03", title: "Conéctate", desc: "Firmas el reto del anchor y recibes un JWT que autoriza tus operaciones.", call: "GET → POST /auth" },
  { n: "04", title: "Deposita o retira", desc: "SPEI → TMXN o TMXN → SPEI en la pantalla interactiva del anchor.", call: "POST /sep24/…/interactive" },
];

// Extracto real de /.well-known/stellar.toml con el resultado de la suite oficial de SDF por SEP.
const TOML = [
  { k: "HOME_DOMAIN", v: "\"sepuente.vercel.app\"", sep: "SEP-1", score: "5/5", what: "Descubrimiento" },
  { k: "WEB_AUTH_ENDPOINT", v: "\"…/auth\"", sep: "SEP-10", score: "16/17", what: "Inicio de sesión con firma" },
  { k: "TRANSFER_SERVER_SEP0024", v: "\"…/sep24\"", sep: "SEP-24", score: "38/38", what: "Depósitos y retiros" },
  { k: "ANCHOR_QUOTE_SERVER", v: "\"…/sep38\"", sep: "SEP-38", score: "18/18", what: "Cotizaciones" },
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
              <div className={styles.stat}><dt>Pruebas oficiales SDF</dt><dd className={styles.statGreen}>75/76</dd></div>
              <div className={styles.stat}><dt>Comisión</dt><dd>0.5&nbsp;%</dd></div>
            </Enter>
          </div>
        </section>

        {/* ── En palabras simples ── */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="simple-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>En palabras simples</Reveal>
            <Reveal as="h2" id="simple-title" className={styles.h2} delay={0.05}>Tu banco y tu wallet, conectados</Reveal>
            <Reveal className={styles.receipt} delay={0.08}>
              <div className={styles.receiptHead}>
                <span>Comprobante de ejemplo</span>
                <span>Comisión 0.5 % por tramo</span>
              </div>
              <ol className={styles.receiptRows}>
                {SIMPLE.map((s, i) => (
                  <li key={s.t} className={styles.receiptRow}>
                    <span className={styles.receiptNum} aria-hidden="true">{i + 1}</span>
                    <div className={styles.receiptText}>
                      <h3 className={styles.receiptTitle}>{s.t}</h3>
                      <p className={styles.featureDesc}>{s.d}</p>
                    </div>
                    <div className={styles.receiptAmt} data-tone={s.tone}>
                      <span className={styles.receiptValue}>{s.amt} <small>{s.unit}</small></span>
                      <span className={styles.receiptVia}>{s.via}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className={styles.receiptFoot}>Ilustración con montos calculados · el SPEI de la demo es simulado</p>
            </Reveal>
            <Reveal><Glossary /></Reveal>
          </div>
        </section>

        {/* ── Características ── */}
        <section className={styles.section} aria-labelledby="features-title">
          <div className={styles.sectionInner}>
            <Reveal as="p" className={styles.eyebrow}>Protocolo</Reveal>
            <Reveal as="h2" id="features-title" className={styles.h2} delay={0.05}>Infraestructura abierta para el peso en Stellar</Reveal>
            <div className={styles.featureSplit}>
              <Reveal className={styles.zero} delay={0.08}>
                <span className={styles.zeroLabel}>Fondos en custodia de SEPuente</span>
                <span className={styles.zeroValue}>$0<span>.00</span></span>
                <p className={styles.zeroText}>El anchor nunca guarda tus pesos ni tus llaves: cada pago en Stellar lo firma tu wallet. SEPuente solo traduce entre SPEI y la red.</p>
              </Reveal>
              <Stagger as="ul" className={styles.featureList}>
                {FEATURES.filter((f) => f.title !== "Sin custodia").map((f) => (
                  <StaggerItem as="li" key={f.title} className={styles.feature}>
                    <span className={styles.featureIcon} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                    </span>
                    <div className={styles.featureText}>
                      <h3 className={styles.featureTitle}>{f.title}</h3>
                      <p className={styles.featureDesc}>{f.desc}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
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
                  <span className={styles.flowNum} aria-hidden="true">{s.n}</span>
                  <div className={styles.flowBody}>
                    <h3 className={styles.featureTitle}>{s.title}</h3>
                    <p className={styles.featureDesc}>{s.desc}</p>
                    <code className={styles.flowCall}>{s.call}</code>
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
            <Reveal as="p" className={styles.sectionLead} delay={0.08}>
              Cualquier wallet lee este archivo y sabe cómo hablar con el anchor. Al lado, el resultado de la suite oficial <code className={styles.inlineCode}>@stellar/anchor-tests</code> de SDF por cada estándar.
            </Reveal>
            <Reveal className={styles.toml} delay={0.12}>
              <div className={styles.tomlBar}>
                <a href="/.well-known/stellar.toml" target="_blank" rel="noreferrer" className={styles.tomlPath}>/.well-known/stellar.toml</a>
                <span className={styles.tomlTotal}>75/76 pruebas</span>
              </div>
              <ul className={styles.tomlLines}>
                {TOML.map((t) => (
                  <li key={t.k} className={styles.tomlLine}>
                    <code className={styles.tomlCode}><span className={styles.tomlKey}>{t.k}</span> = <span className={styles.tomlVal}>{t.v}</span></code>
                    <span className={styles.tomlSep}>
                      <strong>{t.sep}</strong>
                      <span>{t.what}</span>
                      <span className={styles.tomlScore} data-full={t.score.split("/")[0] === t.score.split("/")[1] || undefined}>{t.score}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.tomlNote}>La prueba que falta en SEP-10 compara la hora del reto con el reloj de la máquina que corre la suite; con el reloj sincronizado pasa.</p>
            </Reveal>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.cta}>
          <Reveal className={styles.ctaInner}>
            <h2 className={styles.h2}>Pruébalo ahora</h2>
            <p className={styles.sectionLead}>Entra con tu correo y un código, o con una llave generada en tu navegador. Sin instalar nada, en menos de dos minutos.</p>
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
