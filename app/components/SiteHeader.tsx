"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";

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
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.burger}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>

            {open && (
              <ul id="site-menu" className={styles.menu}>
                {LINKS.map((l) => (
                  <li key={l.href}>
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
                  </li>
                ))}
              </ul>
            )}
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
