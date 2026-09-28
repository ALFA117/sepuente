"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import "./ambient.css";

/**
 * Fondo ambiental: un túnel de arcos de puente que vienen hacia la cámara (cruzar el puente),
 * sobre una aurora lejana y con monedas de peso cercanas. Completo en el landing, tranquilo en la demo y docs.
 * Colores desde los tokens CSS, así que el modo claro funciona solo.
 */
export function AmbientBackground() {
  const path = usePathname() ?? "/";
  const reduce = useReducedMotion() ?? false;
  const [mobile, setMobile] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const u = () => setMobile(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  // Parallax por puntero (solo puntero fino) y por scroll, suavizados con resorte.
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const px = useSpring(rx, { stiffness: 40, damping: 18 });
  const py = useSpring(ry, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => { rx.set((e.clientX / innerWidth - 0.5) * 2); ry.set((e.clientY / innerHeight - 0.5) * 2); };
    addEventListener("pointermove", on, { passive: true });
    return () => removeEventListener("pointermove", on);
  }, [reduce, rx, ry]);
  const { scrollYProgress } = useScroll();
  const scroll = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const farY = useTransform(scroll, [0, 1], reduce ? [0, 0] : [0, -60]);
  const nearY = useTransform(scroll, [0, 1], reduce ? [0, 0] : [0, -220]);
  const nearX = useTransform(px, (v) => (reduce ? 0 : v * -24));

  // La pantalla del anchor vive dentro de un iframe y el pitch tiene su propio fondo.
  if (path.startsWith("/sep24") || path.startsWith("/pitch")) return null;
  const full = path === "/";

  return (
    <div aria-hidden="true" className={`amb-root ${full ? "amb-full" : "amb-calm"}`}>
      <motion.div className="amb-layer amb-aurora" style={{ y: farY }} />
      <ArchTunnel reduce={reduce} full={full} mobile={mobile} px={px} py={py} scroll={scroll} />
      {full && (
        <motion.div className="amb-layer amb-near" style={{ y: nearY, x: nearX }}>
          <Coin className="amb-coin amb-coin-a" label="$" />
          <Coin className="amb-coin amb-coin-b" label="MXN" />
        </motion.div>
      )}
      <div className="amb-vignette" />
    </div>
  );
}

function Coin({ className, label }: { className: string; label: string }) {
  return (
    <span className={className}>
      <span className="amb-coin-spin">
        <span className="amb-coin-face">{label}</span>
        <span className="amb-coin-face amb-coin-back">{label}</span>
      </span>
    </span>
  );
}

function readRgb(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "201 162 39";
}

function ArchTunnel({ reduce, full, mobile, px, py, scroll }: {
  reduce: boolean; full: boolean; mobile: boolean;
  px: MotionValue<number>; py: MotionValue<number>; scroll: MotionValue<number>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const SPACING = 90;
  const count = mobile ? (full ? 12 : 7) : full ? 22 : 12;
  const rings = useRef<{ z: number; rot: number }[]>([]);
  if (rings.current.length !== count) {
    rings.current = Array.from({ length: count }, (_, i) => ({ z: (i + 1) * SPACING, rot: (i % 5) * 0.05 - 0.1 }));
  }

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => {
    const gold = readRgb("--gold-rgb");
    const info = readRgb("--info-rgb");
    const light = window.matchMedia("(prefers-color-scheme: light)").matches;
    const dim = (full ? 1 : 0.55) * (light ? 0.55 : 1);
    const speed = full ? 38 : 20; // unidades por segundo
    // El centro del túnel queda detrás del logo (derecha en escritorio, arriba en el teléfono), no detrás del texto.
    const cx = (full && !mobile ? w * 0.74 : w / 2) + px.get() * 60;
    const cy = h * (full ? (mobile ? 0.2 : 0.36) : 0.5) + py.get() * 40 - scroll.get() * 80;
    const base = Math.min(w, h) * (mobile ? 0.62 : 0.48);
    ctx.clearRect(0, 0, w, h);
    const list = rings.current;
    const total = list.length * SPACING;
    // De atrás hacia adelante para que los cercanos queden encima.
    const order = [...list].sort((a, b) => b.z - a.z);
    for (const r of order) {
      if (!reduce) { r.z -= speed * dt; if (r.z < 12) r.z += total; }
      const k = 420 / r.z;
      const R = base * k * 0.55;
      if (R < 2 || R > Math.max(w, h) * 1.6) continue;
      const fadeIn = Math.min(1, (total - r.z) / (SPACING * 3));
      const alpha = Math.min(1, k * 0.9) * (mobile ? 0.22 : 0.3) * dim * fadeIn;
      if (alpha < 0.01) continue;
      const tone = list.indexOf(r) % 3 === 0 ? info : gold;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(r.rot + (reduce ? 0 : Math.sin(t * 0.25 + r.z * 0.01) * 0.04));
      ctx.strokeStyle = `rgb(${tone} / ${alpha})`;
      ctx.lineWidth = Math.min(3.2, 0.6 + k * 0.9);
      // Arco del puente + tablero + tirantes: el mismo trazo del logo.
      ctx.beginPath();
      ctx.arc(0, R * 0.2, R, Math.PI, 2 * Math.PI);
      ctx.moveTo(-R * 1.18, R * 0.2);
      ctx.lineTo(R * 1.18, R * 0.2);
      for (const f of [-0.5, 0, 0.5]) {
        const x = f * R;
        const yTop = R * 0.2 - Math.sqrt(Math.max(0, R * R - x * x));
        ctx.moveTo(x, R * 0.2);
        ctx.lineTo(x, yTop);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [full, mobile, px, py, reduce, scroll]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, last = 0;
    const resize = () => {
      w = el.clientWidth; h = el.clientHeight;
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(ctx, w, h, 0, 0);
    };
    resize();
    addEventListener("resize", resize);
    if (reduce) return () => removeEventListener("resize", resize);
    const loop = (ms: number) => {
      const t = ms / 1000;
      const dt = last ? Math.min(0.05, t - last) : 0;
      last = t;
      draw(ctx, w, h, t, dt);
      raf = requestAnimationFrame(loop);
    };
    const vis = () => { cancelAnimationFrame(raf); last = 0; if (!document.hidden) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", vis);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); document.removeEventListener("visibilitychange", vis); };
  }, [draw, reduce]);

  return <canvas ref={ref} className="amb-layer amb-canvas" />;
}
