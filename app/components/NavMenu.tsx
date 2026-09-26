"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../landing.module.css";

export function NavMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <>
      <div className={styles.navLinks}>
        <a href="/devs" className={styles.navLink}>Docs</a>
        <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.navLink}>GitHub</a>
        <a href="/pitch" className={styles.navLink}>Pitch</a>
        <Link href="/demo" className={styles.navCta}>Demo →</Link>
      </div>

      <div className={styles.navMobile}>
        <Link href="/demo" className={styles.navCta}>Demo →</Link>
        <button
          className={styles.burger}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          {open
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>

        {open && (
          <div className={styles.dropMenu} onClick={(e) => e.stopPropagation()}>
            <a href="/devs" className={styles.dropLink} onClick={() => setOpen(false)}>Docs</a>
            <a href="https://github.com/ALFA117/sepuente" target="_blank" rel="noreferrer" className={styles.dropLink} onClick={() => setOpen(false)}>GitHub</a>
            <a href="/pitch" className={styles.dropLink} onClick={() => setOpen(false)}>Pitch</a>
          </div>
        )}
      </div>
    </>
  );
}
