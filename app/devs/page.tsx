"use client";
import Link from "next/link";
import styles from "./page.module.css";
import { SiteHeader, SiteFooter } from "../components/SiteHeader";
import { ui, CopyButton, Icon } from "../components/ui";
import { truncateMiddle } from "@/lib/format";
import { Glossary, Token } from "../components/Glossary";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sepuente.vercel.app").trim().replace(/\/$/, "");
const HOME_DOMAIN = APP_URL.replace(/^https?:\/\//, "");
const ASSET = (process.env.NEXT_PUBLIC_ASSET_CODE ?? "TMXN").trim();
const ISSUER = (process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? "").trim();

const TOML_URL = `${APP_URL}/.well-known/stellar.toml`;
const DEMO_WALLET = `https://demo-wallet.stellar.org/?home_domain=${encodeURIComponent(HOME_DOMAIN)}`;
const ANCHOR_CMD = `npx -p @stellar/anchor-tests stellar-anchor-tests \\\n  --home-domain ${HOME_DOMAIN} \\\n  --seps 1 10 24 38`;

const ENDPOINTS = [
  { sep: "SEP-1", method: "GET", path: "/.well-known/stellar.toml", note: "Descubrimiento · CORS abierto" },
  { sep: "SEP-10", method: "GET", path: "/auth?account=G…", note: "Challenge" },
  { sep: "SEP-10", method: "POST", path: "/auth", note: "Verifica firma → JWT" },
  { sep: "SEP-24", method: "GET", path: "/sep24/info", note: "Activos y límites" },
  { sep: "SEP-24", method: "POST", path: "/sep24/transactions/deposit/interactive", note: "Inicia depósito" },
  { sep: "SEP-24", method: "POST", path: "/sep24/transactions/withdraw/interactive", note: "Inicia retiro" },
  { sep: "SEP-24", method: "GET", path: "/sep24/transaction?id=<id>", note: "Estado de una operación" },
  { sep: "SEP-24", method: "GET", path: "/sep24/transactions", note: "Historial" },
  { sep: "SEP-38", method: "GET", path: "/sep38/info", note: "Pares disponibles" },
  { sep: "SEP-38", method: "GET", path: "/sep38/prices", note: "Precios indicativos" },
  { sep: "SEP-38", method: "GET", path: "/sep38/price", note: "Precio para un monto" },
  { sep: "SEP-38", method: "POST", path: "/sep38/quote", note: "Cotización con vigencia" },
  { sep: "SEP-38", method: "GET", path: "/sep38/quote/<id>", note: "Consulta cotización" },
  { sep: "Demo", method: "POST", path: "/api/faucet", note: "Solo testnet · 3 por día" },
];

const ENV_VARS = [
  { k: "NEXT_PUBLIC_APP_URL", v: "https://sepuente.vercel.app (HTTPS, sin slash final)", side: "public" },
  { k: "NEXT_PUBLIC_ASSET_CODE / NEXT_PUBLIC_ISSUER_PUBLIC_KEY", v: "Código y emisor del token para la wallet demo", side: "public" },
  { k: "DRIVER", v: "mock | etherfuse", side: "server" },
  { k: "SIGNING_SECRET_KEY", v: "Firma de challenges SEP-10", side: "server" },
  { k: "ISSUER_SECRET_KEY", v: "Solo para setup-testnet.ts", side: "server" },
  { k: "DISTRIBUTION_SECRET_KEY", v: "Envía TMXN en depósitos (debe corresponder a DISTRIBUTION_PUBLIC_KEY)", side: "server" },
  { k: "JWT_SECRET", v: "Secreto aleatorio ≥ 32 caracteres (obligatorio en producción)", side: "server" },
  { k: "SUPABASE_SERVICE_ROLE_KEY", v: "Solo en rutas de servidor", side: "server" },
];

const DIFF = [
  { who: "Ramp Kit (SDK)", desc: "Librería que cada app integra directamente; no expone endpoints SEP propios." },
  { who: "StellarMesh", desc: "Mismo patrón SEP-24 pero para saldos de exchanges, no para rampas SPEI." },
  { who: "Anchor Platform", desc: "Para convertirse en anchor propio; requiere infraestructura y operación." },
  { who: "SEPuente", desc: "Adaptador ligero sobre rampas que ya existen, sin modificarlas y sin custodia.", highlight: true },
];

const QUICK = [
  { title: "Wallet demo SEPuente", sub: "Prueba depósito y retiro en testnet desde el navegador.", href: "/demo", internal: true },
  { title: "Demo Wallet de SDF", sub: "La wallet oficial de Stellar, preconfigurada con este anchor.", href: DEMO_WALLET },
  { title: "stellar.toml", sub: "Manifiesto con todos los endpoints publicados.", href: TOML_URL },
];

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`s-${n}`}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNum}>{n}</span>
        <h2 id={`s-${n}`} className={styles.h2}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Code({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.code}>
      <pre className={styles.pre}><code>{value}</code></pre>
      <div className={styles.codeCopy}><CopyButton value={value.replace(/\\\n\s*/g, "")} label={label} /></div>
    </div>
  );
}

export default function DevsPage() {
  return (
    <div className={styles.page}>
      <SiteHeader badge="Docs" />

      <main id="main" className={styles.main}>
        <header className={styles.hero}>
          <p className={ui.eyebrow}>Documentación técnica</p>
          <h1 className={styles.title}>Integra rampas MXN en <span className={styles.accent}>Stellar</span></h1>
          <p className={styles.lead}>
            Anchor open source y no custodial con el stack SEP completo. Apunta tu wallet al dominio y listo.
          </p>
          <ul className={styles.tags}>
            {["SEP-1", "SEP-10", "SEP-24", "SEP-38", "CORS abierto", "No custodial", "MIT"].map((t) => <li key={t}>{t}</li>)}
          </ul>
          <Glossary compact />
        </header>

        <ul className={styles.quick}>
          {QUICK.map((q) => {
            const inner = (
              <>
                <span className={styles.quickTitle}>{q.title}{!q.internal && <span className={styles.ext}>{Icon.external(14)}</span>}</span>
                <span className={styles.quickSub}>{q.sub}</span>
              </>
            );
            return (
              <li key={q.title}>
                {q.internal
                  ? <Link href={q.href} className={styles.quickCard}>{inner}</Link>
                  : <a href={q.href} target="_blank" rel="noreferrer" className={styles.quickCard}>{inner}</a>}
              </li>
            );
          })}
        </ul>

        <Section n="01" title="Endpoints">
          <div className={styles.baseRow}>
            <span className={styles.baseLabel}>URL base</span>
            <code className={`addr ${styles.baseVal}`}>{APP_URL}</code>
            <CopyButton value={APP_URL} label="URL base" />
          </div>
          <ul className={styles.list}>
            {ENDPOINTS.map((e) => (
              <li key={e.method + e.path} className={styles.endpoint}>
                <div className={styles.epTop}>
                  <span className={`${styles.method} ${e.method === "GET" ? styles.get : styles.post}`}>{e.method}</span>
                  <span className={styles.epSep}>{e.sep}</span>
                </div>
                <code className={styles.epPath}>{e.path}</code>
                <span className={styles.epNote}>{e.note}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section n="02" title={`Activo ${ASSET}`}>
          <div className={`${ui.card} ${ui.kvList}`}>
            <div className={ui.kv}><span className={ui.kvKey}>Código</span><span className={ui.kvVal}><Token>{ASSET}</Token> · Test MXN</span></div>
            <div className={ui.kv}>
              <span className={ui.kvKey}>Emisor</span>
              <span className={`${ui.kvVal} ${ui.kvMono}`} title={ISSUER}>{ISSUER ? truncateMiddle(ISSUER, 8, 8) : "Configura NEXT_PUBLIC_ISSUER_PUBLIC_KEY"}</span>
              {ISSUER && <CopyButton value={ISSUER} label="Emisor" />}
            </div>
            <div className={ui.kv}><span className={ui.kvKey}>Red</span><span className={ui.kvVal}>Stellar Testnet</span></div>
            <div className={ui.kv}><span className={ui.kvKey}>Respaldo</span><span className={ui.kvVal}>1 {ASSET} = 1 MXN simulado (driver mock)</span></div>
          </div>
        </Section>

        <Section n="03" title="stellar.toml">
          <Code value={TOML_URL} label="URL del stellar.toml" />
          <p className={styles.note}>Se sirve como <code>text/plain</code> con <code>Access-Control-Allow-Origin: *</code>; todos los endpoints SEP responden con CORS abierto.</p>
        </Section>

        <Section n="04" title="Prueba rápida sin código">
          <ol className={styles.steps}>
            <li><strong>Abre la Demo Wallet de SDF</strong><span>Entra a <a href={DEMO_WALLET} target="_blank" rel="noreferrer">demo-wallet.stellar.org</a>, ya apuntando a este anchor.</span></li>
            <li><strong>Crea y fondea una cuenta</strong><span>Genera un keypair de testnet y usa “Fund with Friendbot”.</span></li>
            <li><strong>Agrega el activo</strong><span>Código <Token>{ASSET}</Token> (se escribe T-M-X-N: “Test MXN”, peso de prueba), emisor <code>{truncateMiddle(ISSUER, 6, 4)}</code>.</span></li>
            <li><strong>Conecta el anchor</strong><span>Home domain: <code>{HOME_DOMAIN}</code>.</span></li>
            <li><strong>Deposita o retira</strong><span>Sigue el flujo interactivo SEP-24 y verifica el saldo en stellar.expert.</span></li>
          </ol>
        </Section>

        <Section n="05" title="Suite de validación">
          <Code value={ANCHOR_CMD} label="Comando de anchor-tests" />
          <p className={styles.note}>Requiere Node 18+ y el anchor con <code>DRIVER=mock</code>. Ejecuta la suite oficial de SDF para SEP-1, 10, 24 y 38 contra el dominio desplegado.</p>
        </Section>

        <Section n="06" title="Conecta tu wallet">
          <p className={styles.text}>Apunta el <code>home_domain</code> de tu wallet a:</p>
          <Code value={HOME_DOMAIN} label="Home domain" />
          <p className={styles.text}>La wallet leerá el stellar.toml, descubrirá SEP-10 y SEP-24 y podrá ofrecer depósitos y retiros de pesos sin integración adicional.</p>
        </Section>

        <Section n="07" title="Variables de entorno">
          <ul className={styles.list}>
            {ENV_VARS.map((e) => (
              <li key={e.k} className={styles.env}>
                <div className={styles.epTop}>
                  <code className={styles.envKey}>{e.k}</code>
                  <span className={`${ui.badge} ${e.side === "server" ? ui["tone-danger"] : ui["tone-success"]}`}>{e.side === "server" ? "servidor" : "público"}</span>
                </div>
                <span className={styles.epNote}>{e.v}</span>
              </li>
            ))}
          </ul>
          <p className={styles.note}>Las variables de servidor (llaves de firma, JWT_SECRET, service role) nunca llegan al navegador; solo las <code>NEXT_PUBLIC_*</code> son visibles en el cliente.</p>
        </Section>

        <Section n="08" title="¿Por qué SEPuente?">
          <ul className={styles.list}>
            {DIFF.map((d) => (
              <li key={d.who} className={`${styles.diff} ${d.highlight ? styles.diffHl : ""}`}>
                <strong>{d.who}</strong>
                <span>{d.desc}</span>
              </li>
            ))}
          </ul>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
