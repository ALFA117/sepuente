"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useSpring, AnimatePresence } from "motion/react";
import styles from "./page.module.css";
import { SiteHeader } from "../components/SiteHeader";
import { Reveal, Stagger, StaggerItem, Enter, EASE_OUT } from "../components/motion";
import { Logo3D } from "../components/brand/Logo3D";
import { LogoWord } from "../components/brand/Logo";

const CHAPTERS = [
  { id: "portada", label: "Portada" },
  { id: "problema", label: "El problema" },
  { id: "solucion", label: "La solución" },
  { id: "flujo", label: "Cómo funciona" },
  { id: "arquitectura", label: "Arquitectura" },
  { id: "estandares", label: "Estándares" },
  { id: "diferencia", label: "Diferenciación" },
  { id: "stack", label: "Stack" },
  { id: "empezar", label: "Empezar" },
];

const I = {
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>,
  dash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 12h12" /></svg>,
  up: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>,
  down: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  arrow: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
};

const icon = (d: React.ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const PAINS = [
  { t: "Sin estándar", d: "Etherfuse, Bitso y Kushki exponen APIs propietarias incompatibles entre sí." },
  { t: "Descubrimiento manual", d: "Una wallet Stellar no puede encontrar rampas MXN por sí sola." },
  { t: "Dependencia de un proveedor", d: "Integrar una rampa ata al usuario a un único proveedor regulado." },
];

const ATTRS = [
  { t: "No custodial", d: "Nunca toca fondos ni llaves de usuarios.", i: icon(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>) },
  { t: "Open source", d: "MIT · auditable · forkeable.", i: icon(<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />) },
  { t: "Serverless", d: "Sin procesos de fondo: estado pull-on-read.", i: icon(<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />) },
  { t: "Driver intercambiable", d: "Interfaz RampDriver para cualquier proveedor SPEI.", i: icon(<path d="M12 22v-5M9 7V2M15 7V2M12 17a5 5 0 0 0 5-5V7H7v5a5 5 0 0 0 5 5z" />) },
];

const STEPS = [
  { t: "Descubrimiento", d: "La wallet lee stellar.toml y encuentra los endpoints.", code: "SEP-1" },
  { t: "Autenticación", d: "Firma un challenge y recibe un JWT sin estado.", code: "SEP-10" },
  { t: "Cotización", d: "Precio y comisión con vigencia de 15 minutos.", code: "SEP-38" },
  { t: "Instrucciones", d: "CLABE + referencia SPEI, o cuenta Stellar + memo.", code: "SEP-24" },
  { t: "Liquidación", d: "TMXN llega a la wallet; el estado se actualiza al consultarlo.", code: "Stellar" },
];

const SEPS = [
  { n: "SEP-1", name: "Stellar Info", d: "stellar.toml dinámico con endpoints, activos y datos del anchor.", score: "5/5" },
  { n: "SEP-10", name: "Web Auth", d: "Inicio de sesión firmado por la wallet, con multisig. JWT sin sesiones en servidor.", score: "16/17" },
  { n: "SEP-24", name: "Transferencias interactivas", d: "Depósito SPEI → TMXN y retiro TMXN → SPEI con historial.", score: "38/38" },
  { n: "SEP-38", name: "Cotizaciones", d: "Precio con comisión transparente y cotizaciones con vencimiento.", score: "18/18" },
];

const COMPARE = [
  { who: "Ramp Kit", what: "SDK que cada app integra", sep24: false, adapts: false, kyc: false },
  { who: "StellarMesh", what: "SEP-24 para saldos de exchanges", sep24: true, adapts: false, kyc: false },
  { who: "Anchor Platform (SDF)", what: "Ser anchor desde cero", sep24: true, adapts: false, kyc: false },
  { who: "SEPuente", what: "Adaptador sobre rampas reguladas", sep24: true, adapts: true, kyc: true, hl: true },
];

const STACK = [
  { n: "Next.js 15", r: "App Router · rutas API" },
  { n: "Stellar SDK", r: "WebAuth · Horizon" },
  { n: "Supabase", r: "Postgres · RLS" },
  { n: "Vercel", r: "Serverless · CI/CD" },
  { n: "Tokens de sesión", r: "Librería jose · JWT HS256" },
  { n: "TypeScript", r: "Tipos de punta a punta" },
  { n: "MockDriver", r: "Testnet · 1 TMXN = 1 MXN" },
  { n: "Etherfuse", r: "Driver sandbox SPEI" },
];

function Chapter({ id, n, eyebrow, title, children, className = "" }: { id: string; n: number; eyebrow: string; title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`${styles.chapter} ${className}`} aria-labelledby={`${id}-t`}>
      <div className={styles.inner}>
        <Reveal as="p" className={styles.eyebrow}>
          <span className={styles.eyebrowNum}>{String(n).padStart(2, "0")}</span> {eyebrow}
        </Reveal>
        <Reveal as="h2" id={`${id}-t`} className={styles.h2} delay={0.05}>{title}</Reveal>
        {children}
      </div>
    </section>
  );
}

export default function PitchPage() {
  const reduce = useReducedMotion();
  const [cur, setCur] = useState(0);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  const curRef = useRef(0);

  // Capítulo actual: el último cuyo inicio pasó el 40 % de la pantalla.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const line = window.innerHeight * 0.4;
      let idx = 0;
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = CHAPTERS.length - 1;
      curRef.current = idx;
      setCur(idx);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const goTo = useCallback((i: number) => {
    const target = Math.max(0, Math.min(CHAPTERS.length - 1, i));
    document.getElementById(CHAPTERS[target].id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [reduce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowDown", "ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) { e.preventDefault(); goTo(curRef.current + 1); }
      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) { e.preventDefault(); goTo(curRef.current - 1); }
      if (e.key === "Home") { e.preventDefault(); goTo(0); }
      if (e.key === "End") { e.preventDefault(); goTo(CHAPTERS.length - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  return (
    <div className={styles.root}>
      <SiteHeader badge="Pitch" />
      <motion.div className={styles.progress} style={{ scaleX: reduce ? scrollYProgress : progress }} aria-hidden="true" />

      {/* Índice lateral (escritorio) */}
      <nav className={styles.rail} aria-label="Capítulos">
        <ol>
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button type="button" className={styles.railBtn} onClick={() => goTo(i)} aria-current={cur === i ? "step" : undefined}>
                <span className={styles.railLabel}>{c.label}</span>
                <span className={styles.railDot}>
                  {cur === i && <motion.span layoutId="rail-active" className={styles.railDotActive} transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main id="main">
        {/* ── 1. Portada ── */}
        <section id="portada" className={`${styles.chapter} ${styles.cover}`} aria-labelledby="portada-t">
          <div className={styles.coverGlow} aria-hidden="true" />
          <div className={styles.inner}>
            <Enter as="p" className={styles.chip}><span className={styles.chipDot} aria-hidden="true" />Stellar Testnet · en vivo</Enter>
            <h1 id="portada-t" className="sr-only">SEPuente</h1>
            <Enter className={styles.coverBrand} delay={0.06} y={20}>
              <Logo3D className={styles.cover3d} />
              <LogoWord className={styles.coverWord} />
            </Enter>
            <Enter as="p" className={styles.coverLead} delay={0.12}>
              El anchor open source que conecta <strong>SPEI</strong> con <strong>Stellar</strong>, sin custodiar un solo peso.
            </Enter>
            <Enter className={styles.coverTags} delay={0.18}>
              {["SEP-1 · 10 · 24 · 38", "No custodial", "MIT", "Serverless"].map((t) => <span key={t}>{t}</span>)}
            </Enter>
            <Enter className={styles.coverCtas} delay={0.24}>
              <Link href="/demo" className={styles.btnPrimary}>Ver la demo {I.arrow}</Link>
              <button type="button" className={styles.btnGhost} onClick={() => goTo(1)}>Empezar el pitch {I.down}</button>
            </Enter>
          </div>
        </section>

        {/* ── 2. Problema ── */}
        <Chapter id="problema" n={2} eyebrow="El problema" title={<>Rampas SPEI sin <span className={styles.gold}>estándar común</span></>}>
          <Reveal as="p" className={styles.quote} delay={0.1}>
            Cada rampa MXN tiene su propia API. Cada wallet tiene que integrarlas <em>una por una</em>.
          </Reveal>
          <Stagger as="ul" className={styles.pains}>
            {PAINS.map((p) => (
              <StaggerItem as="li" key={p.t} className={styles.pain}>
                <span className={`${styles.mark} ${styles.markNo}`}>{I.x}</span>
                <div><strong>{p.t}</strong><p>{p.d}</p></div>
              </StaggerItem>
            ))}
            <StaggerItem as="li" className={`${styles.pain} ${styles.painYes}`}>
              <span className={`${styles.mark} ${styles.markYes}`}>{I.check}</span>
              <div><strong>SEPuente</strong><p>Una sola integración estándar para cualquier proveedor SPEI.</p></div>
            </StaggerItem>
          </Stagger>
        </Chapter>

        {/* ── 3. Solución ── */}
        <Chapter id="solucion" n={3} eyebrow="La solución" title={<>Una capa de <span className={styles.gold}>protocolo</span>, no una rampa nueva</>}>
          <Reveal as="p" className={styles.lead} delay={0.1}>
            SEPuente traduce la API del proveedor al estándar de Stellar. El KYC y el dinero se quedan en el proveedor regulado; SEPuente solo cambia la <strong>interfaz</strong>.
          </Reveal>
          <Stagger as="dl" className={styles.stats}>
            <StaggerItem className={styles.stat}><dt>SEPs implementados</dt><dd>4</dd></StaggerItem>
            <StaggerItem className={styles.stat}><dt>Fondos en custodia</dt><dd className={styles.success}>$0</dd></StaggerItem>
            <StaggerItem className={styles.stat}><dt>Para integrar</dt><dd>1 URL</dd></StaggerItem>
          </Stagger>
          <Stagger as="ul" className={styles.attrs}>
            {ATTRS.map((a) => (
              <StaggerItem as="li" key={a.t} className={styles.attr}>
                <span className={styles.attrIcon}>{a.i}</span>
                <strong>{a.t}</strong>
                <p>{a.d}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Chapter>

        {/* ── 4. Flujo ── */}
        <Chapter id="flujo" n={4} eyebrow="Protocolo" title="Cómo funciona">
          <Stagger as="ol" className={styles.timeline}>
            {STEPS.map((s, i) => (
              <StaggerItem as="li" key={s.t} className={styles.tStep}>
                <span className={styles.tNum}>{i + 1}</span>
                <div className={styles.tBody}>
                  <span className={styles.tCode}>{s.code}</span>
                  <strong>{s.t}</strong>
                  <p>{s.d}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Chapter>

        {/* ── 5. Arquitectura ── */}
        <Chapter id="arquitectura" n={5} eyebrow="Arquitectura" title={<>Diseño <span className={styles.gold}>serverless</span></>}>
          <Stagger className={styles.arch} role="img" aria-label="La wallet habla SEP-10 y SEP-24 con SEPuente; SEPuente usa un RampDriver hacia el proveedor SPEI y el banco, y mueve TMXN en Stellar.">
            <StaggerItem className={`${styles.node} ${styles.nodeInfo}`}><strong>Wallet / App</strong><span>Cualquier cliente SEP-24</span></StaggerItem>
            <StaggerItem className={styles.edge}><span>SEP-10 · SEP-24</span></StaggerItem>
            <StaggerItem className={`${styles.node} ${styles.nodeGold}`}>
              <strong><span className={styles.gold}>SEP</span>uente</strong>
              <span>Next.js · Supabase · Vercel</span>
              <span className={styles.nodeTags}>{["SEP-1", "SEP-10", "SEP-24", "SEP-38"].map((t) => <em key={t}>{t}</em>)}</span>
            </StaggerItem>
            <StaggerItem className={styles.split}>
              <div className={styles.branch}>
                <div className={styles.edge}><span>RampDriver</span></div>
                <div className={styles.node}><strong>Proveedor SPEI</strong><span>MockDriver en la demo · Etherfuse (sandbox)</span></div>
                <div className={styles.edge}><span>SPEI</span></div>
                <div className={styles.node}><strong>Banco</strong><span>CLABE + referencia</span></div>
              </div>
              <div className={styles.branch}>
                <div className={styles.edge}><span>Pagos TMXN</span></div>
                <div className={`${styles.node} ${styles.nodeSuccess}`}><strong>Stellar</strong><span>Testnet · Horizon</span></div>
              </div>
            </StaggerItem>
          </Stagger>
          <Reveal as="p" className={styles.note}>La demo pública usa <code>MockDriver</code>: el SPEI es simulado y los TMXN se envían de verdad en testnet.</Reveal>
        </Chapter>

        {/* ── 6. Estándares ── */}
        <Chapter id="estandares" n={6} eyebrow="Estándares" title={<>Cuatro SEPs, <span className={styles.gold}>una URL</span></>}>
          <Stagger as="ul" className={styles.seps}>
            {SEPS.map((s) => (
              <StaggerItem as="li" key={s.n} className={styles.sep}>
                <span className={styles.sepN}>{s.n}</span>
                <strong>{s.name}</strong>
                <p>{s.d}</p>
                <span className={styles.sepOk}>{I.check} Suite oficial SDF: {s.score}</span>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal as="p" className={styles.note}>
            <strong>75 de 76 pruebas oficiales de <code>@stellar/anchor-tests</code></strong> contra producción. La restante compara la hora del reto de login con el reloj de la máquina que corre la prueba.
          </Reveal>
        </Chapter>

        {/* ── 7. Diferenciación ── */}
        <Chapter id="diferencia" n={7} eyebrow="Diferenciación" title={<>¿Por qué no <span className={styles.gold}>algo existente?</span></>}>
          <Stagger as="ul" className={styles.compare}>
            {COMPARE.map((c) => (
              <StaggerItem as="li" key={c.who} className={`${styles.cmp} ${c.hl ? styles.cmpHl : ""}`}>
                <div className={styles.cmpHead}><strong>{c.who}</strong><span>{c.what}</span></div>
                <dl className={styles.cmpRows}>
                  {([["Servidor SEP-24", c.sep24], ["Adapta rampas existentes", c.adapts], ["Usa el KYC del proveedor", c.kyc]] as const).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd className={v ? styles.yes : styles.no}>{v ? I.check : I.dash}<span className="sr-only">{v ? "Sí" : "No"}</span></dd>
                    </div>
                  ))}
                </dl>
              </StaggerItem>
            ))}
          </Stagger>
        </Chapter>

        {/* ── 8. Stack ── */}
        <Chapter id="stack" n={8} eyebrow="Stack tecnológico" title={<>Construido sobre <span className={styles.gold}>tecnología probada</span></>}>
          <Stagger as="ul" className={styles.stack}>
            {STACK.map((t) => (
              <StaggerItem as="li" key={t.n} className={styles.tech}><strong>{t.n}</strong><span>{t.r}</span></StaggerItem>
            ))}
          </Stagger>
        </Chapter>

        {/* ── 9. Empezar ── */}
        <section id="empezar" className={`${styles.chapter} ${styles.closing}`} aria-labelledby="empezar-t">
          <div className={styles.coverGlow} aria-hidden="true" />
          <div className={styles.inner}>
            <Reveal as="p" className={styles.eyebrow}><span className={styles.eyebrowNum}>09</span> Empezar</Reveal>
            <Reveal as="h2" id="empezar-t" className={styles.closingTitle} delay={0.05}>Listo para usar en <span className={styles.gold}>testnet hoy</span></Reveal>
            <Reveal as="p" className={styles.lead} delay={0.1}>Apunta cualquier wallet SEP-24 a <code>sepuente.vercel.app</code> o prueba la wallet demo en tu teléfono.</Reveal>
            <Reveal className={styles.coverCtas} delay={0.15}>
              <Link href="/demo" className={styles.btnPrimary}>Abrir la demo {I.arrow}</Link>
              <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.btnGhost}>Código en GitHub</a>
              <Link href="/devs" className={styles.btnGhost}>Documentación</Link>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Control flotante al alcance del pulgar */}
      <div className={styles.dock} role="navigation" aria-label="Navegar el pitch">
        <button type="button" className={styles.dockBtn} onClick={() => goTo(cur - 1)} disabled={cur === 0} aria-label="Capítulo anterior">{I.up}</button>
        <div className={styles.dockLabel} aria-live="polite">
          <span className={styles.dockCount}>{String(cur + 1).padStart(2, "0")}/{String(CHAPTERS.length).padStart(2, "0")}</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={cur}
              className={styles.dockName}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              {CHAPTERS[cur].label}
            </motion.span>
          </AnimatePresence>
        </div>
        <button type="button" className={`${styles.dockBtn} ${styles.dockNext}`} onClick={() => goTo(cur + 1)} disabled={cur === CHAPTERS.length - 1} aria-label="Capítulo siguiente">{I.down}</button>
      </div>
    </div>
  );
}
