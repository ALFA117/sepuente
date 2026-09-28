"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./HelpChat.module.css";

type Link = { href: string; label: string };
interface Faq { id: string; q: string; keys: string[]; a: string; links?: Link[] }

// Respuestas predeterminadas: no hay IA ni servidor; todo se resuelve en el navegador.
const FAQ: Faq[] = [
  { id: "que", q: "¿Qué es SEPuente?", keys: ["que es", "sepuente", "anchor", "para que sirve"],
    a: "Un anchor abierto y sin custodia: conecta transferencias SPEI con Stellar usando el estándar SEP-24. Mandas pesos desde tu banco y los recibes como pesos digitales (TMXN) en cualquier wallet de Stellar, y de regreso." },
  { id: "real", q: "¿Es dinero real?", keys: ["real", "dinero", "valor", "testnet", "prueba", "simulado"],
    a: "No. Todo corre en Stellar testnet: los XLM y TMXN no tienen valor. El SPEI está simulado, pero los pagos en Stellar sí son transacciones reales de testnet que puedes ver en stellar.expert." },
  { id: "tmxn", q: "¿Qué es TMXN?", keys: ["tmxn", "token", "peso digital", "pesos digitales", "activo"],
    a: "Es el token de pesos de prueba del anchor: 1 TMXN = 1 peso. Para recibirlo tu wallet necesita activar una trustline una sola vez." },
  { id: "comision", q: "¿Cuánto cobra?", keys: ["comision", "cobra", "cuesta", "fee", "precio", "costo"],
    a: "0.5 % por operación del anchor. Si depositas 1,000 MXN recibes 995 TMXN. Además, cada transacción en Stellar cuesta 0.00001 XLM de comisión de red." },
  { id: "depositar", q: "¿Cómo deposito?", keys: ["deposit", "depositar", "meter", "recibir pesos", "spei"],
    a: "En la demo: completa los 3 pasos, toca Depositar, escribe el monto, confirma la cotización y usa «Simular SPEI recibido». En unos segundos los TMXN llegan a tu wallet.",
    links: [{ href: "/demo", label: "Abrir la demo" }] },
  { id: "retirar", q: "¿Cómo retiro a mi banco?", keys: ["retir", "sacar", "clabe", "banco", "regresar"],
    a: "Toca Retirar, escribe el monto y una CLABE (hay una de prueba), confirma y envía los TMXN desde tu wallet. El anchor detecta el pago en Stellar y manda el SPEI (simulado en la demo)." },
  { id: "custodia", q: "¿SEPuente guarda mi dinero o mis llaves?", keys: ["custodia", "guarda", "llave", "seguro", "segur", "privada"],
    a: "No. SEPuente nunca recibe tus llaves ni guarda fondos: cada pago en Stellar lo firma tu wallet. Con la llave en el navegador, la llave vive solo en tu pestaña; con correo, la resguarda Pollar." },
  { id: "correo", q: "¿Cómo entro con mi correo?", keys: ["correo", "email", "pollar", "codigo", "verific"],
    a: "En la demo elige «Con mi correo», escribe tu correo y el código de 6 dígitos que te llega. Pollar crea tu wallet de Stellar; no necesitas instalar nada.",
    links: [{ href: "/demo", label: "Ir a la demo" }] },
  { id: "trustline", q: "¿Qué es una trustline?", keys: ["trustline", "linea de confianza", "activar"],
    a: "Es el permiso que da tu wallet para recibir un token específico, en este caso TMXN. Se activa una vez y reserva 0.5 XLM en tu cuenta." },
  { id: "sep", q: "¿Qué son SEP-10 y SEP-24?", keys: ["sep", "sep-10", "sep-24", "sep-38", "estandar", "protocolo"],
    a: "Son estándares de Stellar. SEP-10: tu wallet firma un reto para iniciar sesión sin contraseña. SEP-24: la pantalla interactiva de depósito y retiro. SEP-38: cotizaciones. SEPuente pasa 75 de 76 pruebas oficiales de SDF.",
    links: [{ href: "/devs", label: "Ver documentación" }] },
  { id: "stellar", q: "¿Por qué Stellar?", keys: ["por que stellar", "stellar", "blockchain", "red"],
    a: "Porque Stellar ya tiene un estándar de rampas (anchors y SEP-24): una wallet integra una vez y funciona con cualquier anchor. Además, emitir el peso es nativo y cada pago tarda unos 5 segundos y cuesta una fracción de centavo." },
  { id: "ver", q: "¿Dónde veo mi transacción?", keys: ["transaccion", "hash", "explorador", "stellar.expert", "ver"],
    a: "En el historial de la demo cada operación completada tiene un enlace a stellar.expert (testnet) con la transacción real." },
  { id: "integrar", q: "¿Cómo lo integro en mi wallet?", keys: ["integr", "wallet", "desarrollador", "api", "endpoint", "codigo abierto"],
    a: "Apunta tu wallet SEP-24 al dominio sepuente.vercel.app: descubre los endpoints en /.well-known/stellar.toml. El código es MIT en GitHub.",
    links: [{ href: "/devs", label: "Documentación" }, { href: "https://github.com/ALFA117/sepuente", label: "GitHub" }] },
];

const SUGGESTED = ["que", "real", "comision", "depositar", "custodia", "correo"];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function match(text: string): Faq | null {
  const t = norm(text);
  let best: Faq | null = null, score = 0;
  for (const f of FAQ) {
    const s = f.keys.reduce((n, k) => n + (t.includes(norm(k)) ? norm(k).length : 0), 0);
    if (s > score) { score = s; best = f; }
  }
  return best;
}

interface Msg { id: number; from: "bot" | "user"; text: string; links?: Link[] }

export function HelpChat() {
  const path = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, from: "bot", text: "Hola, soy la ayuda de SEPuente. Elige una pregunta o escribe la tuya." },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" }); }, [msgs, typing, reduce]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // La pantalla del anchor vive en un iframe y el pitch tiene su propio control inferior.
  if (path.startsWith("/sep24") || path.startsWith("/pitch")) return null;

  const ask = (text: string, faq?: Faq | null) => {
    const q = text.trim();
    if (!q || typing) return;
    const f = faq ?? match(q);
    setMsgs((m) => [...m, { id: nextId.current++, from: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, f
        ? { id: nextId.current++, from: "bot", text: f.a, links: f.links }
        : { id: nextId.current++, from: "bot", text: "No tengo una respuesta para eso todavía. Prueba con una de las preguntas de abajo o revisa la documentación.", links: [{ href: "/devs", label: "Documentación" }] }]);
    }, reduce ? 0 : 550);
  };

  const asked = new Set(msgs.filter((m) => m.from === "user").map((m) => m.text));
  const chips = FAQ.filter((f) => !asked.has(f.q)).sort((a, b) => (SUGGESTED.includes(b.id) ? 1 : 0) - (SUGGESTED.includes(a.id) ? 1 : 0)).slice(0, 4);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            className={styles.panel}
            role="dialog"
            aria-label="Ayuda de SEPuente"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <header className={styles.head}>
              <span className={styles.avatar} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 17h18M5 17a7 7 0 0 1 14 0M9 17v-4M12 17v-6M15 17v-4" /></svg>
              </span>
              <div className={styles.titles}>
                <strong>Ayuda SEPuente</strong>
                <span>Respuestas predeterminadas · no es IA</span>
              </div>
              <button type="button" className={styles.close} onClick={() => { setOpen(false); btnRef.current?.focus(); }} aria-label="Cerrar ayuda">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </header>

            <div ref={listRef} className={styles.list} aria-live="polite">
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.div
                    key={m.id}
                    className={`${styles.msg} ${m.from === "user" ? styles.user : styles.bot}`}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p>{m.text}</p>
                    {m.links && (
                      <span className={styles.links}>
                        {m.links.map((l) => (
                          <a key={l.href} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{l.label} →</a>
                        ))}
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {typing && (
                <div className={`${styles.msg} ${styles.bot} ${styles.typing}`} aria-label="Escribiendo">
                  <span /><span /><span />
                </div>
              )}
            </div>

            {chips.length > 0 && (
              <div className={styles.chips}>
                {chips.map((f) => (
                  <button key={f.id} type="button" className={styles.chip} onClick={() => ask(f.q, f)} disabled={typing}>{f.q}</button>
                ))}
              </div>
            )}

            <form className={styles.form} onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <label htmlFor="helpchat-input" className="sr-only">Escribe tu pregunta</label>
              <input
                id="helpchat-input"
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta…"
                maxLength={200}
                autoComplete="off"
              />
              <button type="submit" className={styles.send} disabled={!input.trim() || typing} aria-label="Enviar pregunta">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        ref={btnRef}
        type="button"
        className={styles.fab}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Cerrar ayuda" : "Abrir ayuda: preguntas frecuentes"}
        whileHover={reduce ? undefined : { scale: 1.05 }}
        whileTap={reduce ? undefined : { scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "x" : "q"}
            className={styles.fabIcon}
            initial={reduce ? false : { opacity: 0, rotate: -60, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, rotate: 60, scale: 0.6 }}
            transition={{ duration: 0.16 }}
          >
            {open
              ? <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              : <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4M12 16h.01" /></svg>}
          </motion.span>
        </AnimatePresence>
        <span className={styles.fabText}>Ayuda</span>
      </motion.button>
    </>
  );
}
