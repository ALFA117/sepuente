"use client";
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("sr-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-48px 0px" }
    );
    document.querySelectorAll("[data-sr]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
