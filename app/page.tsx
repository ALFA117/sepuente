import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <span className={styles.navBrand}>
          <span className={styles.navSymbol}>⟴</span>
          SEPuente
        </span>
        <div className={styles.navLinks}>
          <a href="/devs" className={styles.navLink}>Docs</a>
          <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
          <a href="/pitch" className={styles.navLink}>Pitch</a>
          <Link href="/demo" className={styles.navCta}>Demo →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
          <div className={styles.heroGrid} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroChip}>
            <span className={styles.heroChipDot} />
            Stellar Testnet · SEP-24
          </div>

          <div className={styles.symbolWrap}>
            <span className={styles.symbol}>⟴</span>
          </div>

          <h1 className={styles.title}>SEPuente</h1>

          <p className={styles.tagline}>
            Anchor <span className={styles.taglineAccent}>SEP-24</span> no custodial
            <br />Pesos mexicanos en Stellar
          </p>

          <div className={styles.ctaRow}>
            <Link href="/demo" className={styles.ctaPrimary}>
              Probar Demo
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.ctaGhost}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
            <a href="/pitch" className={styles.ctaGhost}>
              Ver Pitch
            </a>
          </div>

          <div className={styles.statRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>4</span>
              <span className={styles.statLabel}>SEPs implementados</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>0</span>
              <span className={styles.statLabel}>fondos en custodia</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>∞</span>
              <span className={styles.statLabel}>wallets compatibles</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className={styles.sectionHeader} data-sr>
          <div className={styles.sectionEyebrow}>Protocolo</div>
          <h2 className={styles.sectionTitle}>
            Infraestructura abierta<br/>para el peso en Stellar
          </h2>
        </div>

        <div className={styles.featureGrid}>

          <div className={styles.featureCard} data-sr>
            <div className={`${styles.fIcon} ${styles.fIconGold}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 className={styles.fName}>Sin custodia</h3>
            <p className={styles.fDesc}>SEPuente nunca toca llaves privadas. El protocolo solo facilita el intercambio.</p>
          </div>

          <div className={styles.featureCard} data-sr="delay-1">
            <div className={`${styles.fIcon} ${styles.fIconBlue}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3 className={styles.fName}>Cualquier wallet</h3>
            <p className={styles.fDesc}>Compatible con toda wallet Stellar que implemente SEP-24. Interoperable por diseño.</p>
          </div>

          <div className={styles.featureCard} data-sr="delay-2">
            <div className={`${styles.fIcon} ${styles.fIconGold}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3 className={styles.fName}>Serverless</h3>
            <p className={styles.fDesc}>Corre en Vercel Edge + Supabase. Zero infraestructura que mantener.</p>
          </div>

          <div className={styles.featureCard} data-sr="delay-3">
            <div className={`${styles.fIcon} ${styles.fIconGreen}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>
              </svg>
            </div>
            <h3 className={styles.fName}>Open source</h3>
            <p className={styles.fDesc}>MIT License. Fork, extiende, integra tu propio driver de fiat. Código auditable.</p>
          </div>

          <div className={styles.featureCard} data-sr="delay-4">
            <div className={`${styles.fIcon} ${styles.fIconBlue}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22v-5M9 7V2M15 7V2M12 17a5 5 0 0 0 5-5V7H7v5a5 5 0 0 0 5 5z"/>
              </svg>
            </div>
            <h3 className={styles.fName}>Plug & play driver</h3>
            <p className={styles.fDesc}><code>RampDriver</code> para conectar Etherfuse, STP, SPEI o cualquier proveedor.</p>
          </div>

          <div className={styles.featureCard} data-sr="delay-5">
            <div className={`${styles.fIcon} ${styles.fIconGreen}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <h3 className={styles.fName}>Estándar Stellar</h3>
            <p className={styles.fDesc}>SEP-1 · SEP-10 · SEP-24 · SEP-38. Implementación de referencia completa.</p>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.flow}>
        <div className={styles.flowInner}>
          <div className={styles.sectionEyebrow} data-sr>Flujo completo</div>
          <h2 className={styles.sectionTitle} data-sr="delay-1">De pesos a Stellar en 4 pasos</h2>

          <div className={styles.flowSteps}>
            <div className={styles.flowStep} data-sr="delay-2">
              <div className={styles.flowStepNum}>01</div>
              <div className={styles.flowStepBody}>
                <div className={styles.flowStepTitle}>Fondea tu wallet</div>
                <p className={styles.flowStepDesc}>Genera una clave Stellar y obtén XLM de testnet con el faucet integrado.</p>
              </div>
            </div>
            <div className={styles.flowArrow} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.flowStep} data-sr="delay-3">
              <div className={styles.flowStepNum}>02</div>
              <div className={styles.flowStepBody}>
                <div className={styles.flowStepTitle}>Trustline TMXN</div>
                <p className={styles.flowStepDesc}>Firma <code>changeTrust</code> para autorizar recibir el token de pesos.</p>
              </div>
            </div>
            <div className={styles.flowArrow} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.flowStep} data-sr="delay-4">
              <div className={styles.flowStepNum}>03</div>
              <div className={styles.flowStepBody}>
                <div className={styles.flowStepTitle}>Auth SEP-10</div>
                <p className={styles.flowStepDesc}>Firma el challenge del anchor. El JWT resultante autoriza tus operaciones.</p>
              </div>
            </div>
            <div className={styles.flowArrow} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M12 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.flowStep} data-sr="delay-5">
              <div className={styles.flowStepNum}>04</div>
              <div className={styles.flowStepBody}>
                <div className={styles.flowStepTitle}>Deposita o retira</div>
                <p className={styles.flowStepDesc}>SPEI → TMXN o TMXN → SPEI. Flujo interactivo SEP-24 completo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE DIAGRAM ── */}
      <section className={styles.archSection}>
        <div className={styles.archInner}>
          <div className={styles.sectionEyebrow} data-sr>Arquitectura</div>
          <h2 className={styles.sectionTitle} data-sr="delay-1">Cómo fluye el protocolo</h2>
          <p className={styles.archSub} data-sr="delay-2">
            SEPuente actúa como adaptador sin custodia entre el sistema bancario mexicano y la red Stellar.
          </p>

          {/* SVG Diagram */}
          <div className={styles.archDiagram} data-sr="delay-1">
            <svg viewBox="0 0 700 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.archSvg}>
              <defs>
                {/* Animated dash paths */}
                <style>{`
                  .arch-dash { stroke-dasharray: 6 4; animation: dashMove 1.8s linear infinite; }
                  .arch-dash-rev { stroke-dasharray: 6 4; animation: dashMoveRev 1.8s linear infinite; }
                  .arch-dash-slow { stroke-dasharray: 6 4; animation: dashMove 2.5s linear infinite; }
                  @keyframes dashMove    { to { stroke-dashoffset: -20; } }
                  @keyframes dashMoveRev { to { stroke-dashoffset:  20; } }
                  .arch-node-glow { filter: drop-shadow(0 0 10px currentColor); }
                  .arch-pulse { animation: archPulse 2s ease-in-out infinite; }
                  @keyframes archPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
                `}</style>

                {/* Gold gradient */}
                <radialGradient id="gGold" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C9A227" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#C9A227" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="gBlue" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7DBAFF" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#7DBAFF" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="gGreen" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4CD68E" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#4CD68E" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="gMuted" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8B9BB5" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#8B9BB5" stopOpacity="0"/>
                </radialGradient>

                <marker id="arrowGold" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(201,162,39,0.7)"/>
                </marker>
                <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(125,186,255,0.7)"/>
                </marker>
                <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="rgba(76,214,142,0.7)"/>
                </marker>
              </defs>

              {/* ── GLOW HALOS ── */}
              <ellipse cx="100" cy="80"  rx="60" ry="50" fill="url(#gBlue)"/>
              <ellipse cx="350" cy="160" rx="80" ry="60" fill="url(#gGold)"/>
              <ellipse cx="600" cy="80"  rx="60" ry="50" fill="url(#gGreen)"/>
              <ellipse cx="160" cy="270" rx="55" ry="44" fill="url(#gMuted)"/>
              <ellipse cx="540" cy="270" rx="55" ry="44" fill="url(#gMuted)"/>

              {/* ── CONNECTION LINES ── */}
              {/* Wallet → SEPuente */}
              <line x1="158" y1="90" x2="268" y2="148" stroke="rgba(125,186,255,0.35)" strokeWidth="1.5"
                className="arch-dash" markerEnd="url(#arrowGold)"/>
              {/* Stellar → SEPuente */}
              <line x1="542" y1="90" x2="432" y2="148" stroke="rgba(76,214,142,0.35)" strokeWidth="1.5"
                className="arch-dash-rev" markerEnd="url(#arrowGold)"/>
              {/* SEPuente → SPEI */}
              <line x1="310" y1="188" x2="210" y2="248" stroke="rgba(139,155,181,0.3)" strokeWidth="1.5"
                className="arch-dash-slow" markerEnd="url(#arrowGold)"/>
              {/* SEPuente → TMXN */}
              <line x1="390" y1="188" x2="490" y2="248" stroke="rgba(201,162,39,0.3)" strokeWidth="1.5"
                className="arch-dash-slow" markerEnd="url(#arrowGold)"/>

              {/* SEP labels on lines */}
              <text x="192" y="126" fontSize="9" fill="rgba(125,186,255,0.6)" fontFamily="monospace" textAnchor="middle">SEP-10 JWT</text>
              <text x="508" y="126" fontSize="9" fill="rgba(76,214,142,0.6)" fontFamily="monospace" textAnchor="middle">SEP-24 tx</text>
              <text x="242" y="232" fontSize="9" fill="rgba(139,155,181,0.5)" fontFamily="monospace" textAnchor="middle">SPEI / mock</text>
              <text x="462" y="232" fontSize="9" fill="rgba(201,162,39,0.5)" fontFamily="monospace" textAnchor="middle">mint / burn</text>

              {/* ── NODE: Wallet (left top) ── */}
              <rect x="42" y="42" width="116" height="76" rx="14"
                fill="rgba(17,40,77,0.8)" stroke="rgba(125,186,255,0.3)" strokeWidth="1.5"/>
              <circle cx="100" cy="80" r="18" fill="rgba(125,186,255,0.1)" stroke="rgba(125,186,255,0.4)" strokeWidth="1.2"/>
              {/* wallet icon */}
              <rect x="90" y="71" width="20" height="14" rx="3" stroke="rgba(125,186,255,0.8)" strokeWidth="1.3" fill="none"/>
              <path d="M90 75h20" stroke="rgba(125,186,255,0.8)" strokeWidth="1.3"/>
              <circle cx="107" cy="78.5" r="1.5" fill="rgba(125,186,255,0.9)"/>
              <text x="100" y="106" fontSize="10" fill="#7DBAFF" fontFamily="monospace" textAnchor="middle" fontWeight="700">Wallet</text>
              <text x="100" y="116" fontSize="8.5" fill="rgba(125,186,255,0.5)" fontFamily="monospace" textAnchor="middle">Stellar · SEP-24</text>

              {/* ── NODE: SEPuente (center) ── */}
              <rect x="268" y="112" width="164" height="96" rx="16"
                fill="rgba(17,40,77,0.9)" stroke="rgba(201,162,39,0.45)" strokeWidth="2"/>
              {/* gold glow ring */}
              <rect x="268" y="112" width="164" height="96" rx="16"
                fill="none" stroke="rgba(201,162,39,0.12)" strokeWidth="8" className="arch-pulse"/>
              {/* ⟴ symbol */}
              <text x="350" y="158" fontSize="28" fill="rgba(201,162,39,0.9)" textAnchor="middle" dominantBaseline="middle">⟴</text>
              <text x="350" y="183" fontSize="12" fill="#F5F1E6" fontFamily="monospace" textAnchor="middle" fontWeight="700">SEPuente</text>
              <text x="350" y="197" fontSize="8.5" fill="rgba(201,162,39,0.6)" fontFamily="monospace" textAnchor="middle">Anchor · No custodial</text>

              {/* ── NODE: Stellar (right top) ── */}
              <rect x="542" y="42" width="116" height="76" rx="14"
                fill="rgba(17,40,77,0.8)" stroke="rgba(76,214,142,0.3)" strokeWidth="1.5"/>
              <circle cx="600" cy="80" r="18" fill="rgba(76,214,142,0.1)" stroke="rgba(76,214,142,0.4)" strokeWidth="1.2"/>
              {/* globe icon */}
              <circle cx="600" cy="80" r="10" stroke="rgba(76,214,142,0.8)" strokeWidth="1.2" fill="none"/>
              <ellipse cx="600" cy="80" rx="5" ry="10" stroke="rgba(76,214,142,0.5)" strokeWidth="1" fill="none"/>
              <line x1="590" y1="80" x2="610" y2="80" stroke="rgba(76,214,142,0.5)" strokeWidth="1"/>
              <text x="600" y="106" fontSize="10" fill="#4CD68E" fontFamily="monospace" textAnchor="middle" fontWeight="700">Stellar</text>
              <text x="600" y="116" fontSize="8.5" fill="rgba(76,214,142,0.5)" fontFamily="monospace" textAnchor="middle">Testnet · Horizon</text>

              {/* ── NODE: SPEI (bottom left) ── */}
              <rect x="106" y="238" width="108" height="60" rx="12"
                fill="rgba(17,40,77,0.8)" stroke="rgba(139,155,181,0.2)" strokeWidth="1.5"/>
              <text x="160" y="263" fontSize="13" fill="rgba(139,155,181,0.7)" fontFamily="monospace" textAnchor="middle" fontWeight="700">SPEI</text>
              <text x="160" y="277" fontSize="8.5" fill="rgba(139,155,181,0.4)" fontFamily="monospace" textAnchor="middle">Etherfuse · MockDriver</text>
              <text x="160" y="290" fontSize="8" fill="rgba(139,155,181,0.3)" fontFamily="monospace" textAnchor="middle">Sistema bancario MX</text>

              {/* ── NODE: TMXN (bottom right) ── */}
              <rect x="486" y="238" width="108" height="60" rx="12"
                fill="rgba(17,40,77,0.8)" stroke="rgba(201,162,39,0.25)" strokeWidth="1.5"/>
              <text x="540" y="263" fontSize="13" fill="rgba(201,162,39,0.8)" fontFamily="monospace" textAnchor="middle" fontWeight="700">TMXN</text>
              <text x="540" y="277" fontSize="8.5" fill="rgba(201,162,39,0.4)" fontFamily="monospace" textAnchor="middle">Token Stellar · 1:1 MXN</text>
              <text x="540" y="290" fontSize="8" fill="rgba(201,162,39,0.3)" fontFamily="monospace" textAnchor="middle">Trustline · SEP-1 issuer</text>

            </svg>
          </div>

          {/* Legend */}
          <div className={styles.archLegend} data-sr="delay-3">
            <div className={styles.archLegendItem}>
              <span className={styles.archLegendDot} style={{background:"rgba(125,186,255,0.6)"}}/>
              <span>Wallet del usuario</span>
            </div>
            <div className={styles.archLegendItem}>
              <span className={styles.archLegendDot} style={{background:"rgba(201,162,39,0.8)"}}/>
              <span>SEPuente anchor</span>
            </div>
            <div className={styles.archLegendItem}>
              <span className={styles.archLegendDot} style={{background:"rgba(76,214,142,0.7)"}}/>
              <span>Red Stellar</span>
            </div>
            <div className={styles.archLegendItem}>
              <span className={styles.archLegendDot} style={{background:"rgba(139,155,181,0.5)"}}/>
              <span>Sistema bancario (SPEI)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROTOCOLS ── */}
      <section className={styles.protocols}>
        <div className={styles.protocolsInner}>
          <div className={styles.sectionEyebrow} data-sr>Estándares Stellar implementados</div>
          <div className={styles.protocolGrid}>
            <div className={styles.protoBadge} data-sr>
              <span className={styles.protoNum}>SEP-1</span>
              <span className={styles.protoName}>stellar.toml</span>
            </div>
            <div className={styles.protoBadge} data-sr="delay-1">
              <span className={styles.protoNum}>SEP-10</span>
              <span className={styles.protoName}>Web Auth</span>
            </div>
            <div className={styles.protoBadge} data-sr="delay-2">
              <span className={styles.protoNum}>SEP-24</span>
              <span className={styles.protoName}>Hosted Deposit & Withdrawal</span>
            </div>
            <div className={styles.protoBadge} data-sr="delay-3">
              <span className={styles.protoNum}>SEP-38</span>
              <span className={styles.protoName}>Anchor RFQ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaContent} data-sr>
          <h2 className={styles.ctaTitle}>Pruébalo ahora</h2>
          <p className={styles.ctaSub}>
            Wallet testnet con faucet integrado.<br/>
            Genera una cuenta y prueba el flujo SEP-24 completo.
          </p>
          <Link href="/demo" className={styles.ctaPrimary}>
            Abrir Demo
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer} data-sr>
        <span className={styles.footerBrand}>
          <span className={styles.navSymbol} style={{fontSize:"1rem"}}>⟴</span>
          SEPuente
        </span>
        <div className={styles.footerLinks}>
          <a href="/devs" className={styles.footerLink}>Docs</a>
          <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.footerLink}>GitHub</a>
          <a href="/pitch" className={styles.footerLink}>Pitch</a>
        </div>
        <span className={styles.footerMono}>Stellar Testnet · SEP-24</span>
      </footer>

    </div>
  );
}
