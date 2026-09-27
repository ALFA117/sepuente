"use client";
import { useEffect, useRef, useState } from "react";
import { MARK } from "./paths";
import { LogoMark } from "./Logo";
import styles from "./Logo3D.module.css";

// Colores de marca para WebGL (three no lee variables CSS): espejo de --gold, --gold-active, --info.
const GOLD = 0xc9a227;
const GOLD_DEEP = 0xa9861b;
const RIM = 0x8fb3e0;

/**
 * Símbolo del puente extruido en 3D con three.js.
 * - three se descarga aparte (import dinámico) y solo si hay WebGL.
 * - Mientras carga, o si no hay WebGL, se ve el símbolo vectorial plano (sin salto de layout).
 * - Solo anima cuando está en pantalla y la pestaña visible; con reduced-motion queda estático.
 */
export function Logo3D({ className, label = "Logo de SEPuente en 3D" }: { className?: string; label?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const probe = document.createElement("canvas");
      if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return;

      const THREE = await import("three");
      const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      // Geometría: el trazado SVG del símbolo, extruido con bisel.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK.w} ${MARK.h}"><path fill="#000" fill-rule="evenodd" d="${MARK.d}"/></svg>`;
      const data = new SVGLoader().parse(svg);
      const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p));
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 64,
        bevelEnabled: true,
        bevelThickness: 9,
        bevelSize: 4.5,
        bevelSegments: 4,
        curveSegments: 10,
      });
      geometry.center();

      const faceMat = new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.26, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.15 });
      const sideMat = new THREE.MeshPhysicalMaterial({ color: GOLD_DEEP, metalness: 1, roughness: 0.38, envMapIntensity: 0.9 });
      const mesh = new THREE.Mesh(geometry, [faceMat, sideMat]);
      // Girar 180° en X convierte el eje Y del SVG (hacia abajo) al de three (hacia arriba) sin espejar.
      mesh.rotation.x = Math.PI;

      const scale = 3.2 / MARK.w;
      const pivot = new THREE.Group();
      pivot.scale.setScalar(scale);
      pivot.add(mesh);
      scene.add(pivot);

      const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
      key.position.set(-2.5, 3, 4);
      const rim = new THREE.DirectionalLight(RIM, 2.4);
      rim.position.set(3.5, -1.5, -3);
      const fill = new THREE.AmbientLight(0xffffff, 0.25);
      scene.add(key, rim, fill);

      const camera = new THREE.PerspectiveCamera(28, 2, 0.1, 50);
      camera.position.set(0, 0, 7.2);

      const resize = () => {
        const { width, height } = wrap.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Encuadre: que el ancho del símbolo (con margen para el giro) quepa en pantalla.
        const fitW = 3.2 * 1.18;
        const fitH = (3.2 * MARK.h) / MARK.w * 1.35;
        const vFov = (camera.fov * Math.PI) / 180;
        const distH = fitH / 2 / Math.tan(vFov / 2);
        const distW = fitW / 2 / (Math.tan(vFov / 2) * camera.aspect);
        camera.position.z = Math.max(distH, distW);
        camera.updateProjectionMatrix();
      };
      resize();

      // Interacción: el cursor inclina el símbolo; en táctil, deslizar de lado lo gira (el scroll vertical se conserva).
      const target = { x: 0, y: 0 };
      const current = { x: 0, y: 0 };
      let drag = 0;
      let dragVel = 0;
      let dragging = false;
      let lastX = 0;

      const onPointerMove = (e: PointerEvent) => {
        if (dragging) {
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          drag += dx * 0.012;
          dragVel = dx * 0.012;
          if (reduce) frame(performance.now());
          return;
        }
        if (e.pointerType !== "mouse") return;
        const r = wrap.getBoundingClientRect();
        target.y = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
        target.x = ((e.clientY - r.top) / r.height - 0.5) * 0.4;
      };
      const onPointerDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        wrap.setPointerCapture?.(e.pointerId);
      };
      const onPointerUp = () => { dragging = false; };
      const onLeave = () => { target.x = 0; target.y = 0; };
      wrap.addEventListener("pointermove", onPointerMove);
      wrap.addEventListener("pointerdown", onPointerDown);
      wrap.addEventListener("pointerup", onPointerUp);
      wrap.addEventListener("pointercancel", onPointerUp);
      wrap.addEventListener("pointerleave", onLeave);

      let raf = 0;
      let visible = true;
      let first = true;
      const t0 = performance.now();

      function frame(now: number) {
        const t = (now - t0) / 1000;
        current.x += (target.x - current.x) * 0.08;
        current.y += (target.y - current.y) * 0.08;
        if (!dragging) {
          // Inercia y regreso suave a la posición de reposo.
          drag += dragVel;
          dragVel *= 0.92;
          drag *= 0.965;
        }
        const idleY = reduce ? -0.38 : Math.sin(t * 0.55) * 0.42;
        const idleX = reduce ? 0.12 : 0.1 + Math.sin(t * 0.8) * 0.05;
        pivot.rotation.y = idleY + current.y + drag;
        pivot.rotation.x = idleX + current.x;
        pivot.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.05;
        renderer.render(scene, camera);
        if (first) { first = false; setReady(true); }
      }

      const loop = (now: number) => {
        frame(now);
        raf = requestAnimationFrame(loop);
      };
      const start = () => {
        cancelAnimationFrame(raf);
        if (reduce) { frame(performance.now()); return; }
        if (visible && document.visibilityState === "visible") raf = requestAnimationFrame(loop);
      };

      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }, { rootMargin: "80px" });
      io.observe(wrap);
      const ro = new ResizeObserver(() => { resize(); if (reduce) frame(performance.now()); });
      ro.observe(wrap);
      const onVis = () => start();
      document.addEventListener("visibilitychange", onVis);
      const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf); setReady(false); };
      canvas.addEventListener("webglcontextlost", onLost);

      start();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        canvas.removeEventListener("webglcontextlost", onLost);
        wrap.removeEventListener("pointermove", onPointerMove);
        wrap.removeEventListener("pointerdown", onPointerDown);
        wrap.removeEventListener("pointerup", onPointerUp);
        wrap.removeEventListener("pointercancel", onPointerUp);
        wrap.removeEventListener("pointerleave", onLeave);
        geometry.dispose();
        faceMat.dispose();
        sideMat.dispose();
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ""}`} role="img" aria-label={label} data-ready={ready}>
      <div className={styles.glow} aria-hidden="true" />
      <LogoMark className={styles.fallback} />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
