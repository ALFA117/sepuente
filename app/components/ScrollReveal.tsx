"use client";
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let pending = Array.from(document.querySelectorAll<HTMLElement>("[data-sr]"));
    const reveal = () => {
      const limit = window.innerHeight * 0.95;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= limit) return true;
        el.classList.add("sr-visible");
        return false;
      });
    };
    // Lo que ya está en pantalla se queda visible sin animar.
    reveal();
    if (!pending.length) return;
    document.documentElement.classList.add("sr-ready");

    let raf = 0;
    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(failsafe);
      cancelAnimationFrame(raf);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        reveal();
        if (!pending.length) cleanup();
      });
    };
    // Red de seguridad: si el scroll no se dispara, el contenido aparece igual.
    const failsafe = window.setTimeout(() => {
      pending.forEach((el) => el.classList.add("sr-visible"));
      pending = [];
      cleanup();
    }, 4000);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return cleanup;
  }, []);

  return null;
}
