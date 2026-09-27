"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./SiteHeader.module.css";
import { EASE_OUT } from "./motion";

const LINKS = [
  { href: "/demo", label: "Demo" },
  { href: "/devs", label: "Docs" },
  { href: "/pitch", label: "Pitch" },
  { href: "https://github.com/ALFA117/sepuente", label: "GitHub", external: true },
];

export function Wordmark({ href = "/" }: { href?: string | null }) {
  const mark = (
    <span className={styles.wordmark}>
      <span className={styles.wmGold}>SEP</span>uente
    </span>
  );
  return href ? <Link href={href} className={styles.brand} aria-label="SEPuente, inicio">{mark}</Link> : mark;
}

export function SiteHeader({ badge = "Testnet", minimal = false }: { badge?: string; minimal?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Wordmark href={minimal ? null : "/"} />
          {badge && (
            <span className={styles.badge}>
              <span className={styles.badgeDot} aria-hidden="true" />
              {badge}
            </span>
          )}
        </div>

        {!minimal && (
          <nav className={styles.nav} aria-label="Principal" ref={menuRef}>
            <ul className={styles.links}>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className={styles.link}
                    aria-current={pathname === l.href ? "page" : undefined}
                    {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    {pathname === l.href && (
                      <motion.span
                        layoutId="nav-active"
                        className={styles.activePill}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={styles.linkText}>{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <motion.button
              type="button"
              className={styles.burger}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
              whileTap={reduce ? undefined : { scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.svg
                  key={open ? "x" : "menu"}
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
                  initial={reduce ? false : { opacity: 0, rotate: -90, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, rotate: 90, scale: 0.6 }}
                  transition={{ duration: 0.16, ease: EASE_OUT }}
                >
                  {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </motion.svg>
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
            {open && (
              <motion.ul
                id="site-menu"
                className={styles.menu}
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1, transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28, staggerChildren: 0.04, delayChildren: 0.03 } },
                  exit: reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12, ease: EASE_OUT } },
                }}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ transformOrigin: "top right" }}
              >
                {LINKS.map((l) => (
                  <motion.li
                    key={l.href}
                    variants={reduce ? undefined : { hidden: { opacity: 0, x: 8 }, show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE_OUT } } }}
                  >
                    <a
                      href={l.href}
                      className={styles.menuLink}
                      aria-current={pathname === l.href ? "page" : undefined}
                      {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {l.label}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {l.external ? <path d="M7 17L17 7M9 7h8v8" /> : <path d="M9 6l6 6-6 6" />}
                      </svg>
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            )}
            </AnimatePresence>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <Wordmark />
        <nav aria-label="Pie de página">
          <ul className={styles.footerLinks}>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.footerNote}>Stellar Testnet · Código abierto (MIT) · Sin custodia de fondos</p>
      </div>
    </footer>
  );
}
