"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./HelpChat.module.css";

type Link = { href: string; label: string };
interface Faq { id: string; q: string; keys: string[]; a: string; links?: Link[]; next?: string[] }
interface DemoState { step: number; isEmail: boolean; ops: number; pending: boolean; hasTmxn: boolean }

// Respuestas predeterminadas: no hay IA ni servidor; todo se resuelve en el navegador.
// **texto** se muestra en negritas.
const FAQ: Faq[] = [
  { id: "ahora", q: "¿Qué hago ahora?", keys: ["que hago", "ahora", "siguiente", "atorado", "no se que hacer", "ayuda"], a: "", next: ["depositar", "retirar"] },
  { id: "que", q: "¿Qué es SEPuente?", keys: ["que es", "sepuente", "anchor", "para que sirve"],
    a: "Un **anchor abierto y sin custodia**: conecta transferencias SPEI con Stellar usando el estándar SEP-24. Mandas pesos desde tu banco y los recibes como pesos digitales (TMXN) en cualquier wallet de Stellar, y de regreso.",
    next: ["custodia", "stellar", "real"] },
  { id: "real", q: "¿Es dinero real?", keys: ["real", "valor", "testnet", "prueba", "simulado", "de verdad"],
    a: "No. Todo corre en **Stellar testnet**: los XLM y TMXN no tienen valor. El SPEI está simulado, pero los pagos en Stellar sí son transacciones reales de testnet que puedes abrir en stellar.expert.",
    next: ["ver", "tmxn"] },
  { id: "tmxn", q: "¿Qué es TMXN?", keys: ["tmxn", "token", "peso digital", "pesos digitales", "activo"],
    a: "El token de pesos de prueba del anchor: **1 TMXN = 1 peso**. Para recibirlo, tu wallet activa una trustline una sola vez.", next: ["trustline", "comision"] },
  { id: "xlm", q: "¿Para qué sirven los XLM?", keys: ["xlm", "lumens", "faucet", "saldo de prueba"],
    a: "XLM es la moneda de la red Stellar. Aquí solo sirve para pagar la **comisión de red (0.00001 XLM por transacción)** y la reserva de 0.5 XLM de la trustline. No se convierte en pesos.", next: ["comision", "trustline"] },
  { id: "comision", q: "¿Cuánto cobra?", keys: ["comision", "cobra", "cuesta", "fee", "precio", "costo", "cuanto"],
    a: "**0.5 % por operación** del anchor: si depositas 1,000 MXN recibes 995 TMXN, y si retiras 500 TMXN recibes 497.50 MXN. Aparte, cada transacción en Stellar cuesta 0.00001 XLM de red.", next: ["depositar", "retirar"] },
  { id: "depositar", q: "¿Cómo deposito?", keys: ["deposit", "depositar", "meter", "recibir pesos", "spei"],
    a: "Con los 3 pasos listos: toca **Depositar**, escribe el monto (10 a 50,000 MXN), revisa la cotización, confirma y usa **Simular SPEI recibido**. En unos segundos los TMXN llegan a tu wallet.",
    links: [{ href: "/demo", label: "Abrir la demo" }], next: ["tarda", "ver"] },
  { id: "retirar", q: "¿Cómo retiro a mi banco?", keys: ["retir", "sacar", "clabe", "banco", "regresar"],
    a: "Toca **Retirar**, escribe el monto y una CLABE (hay una de prueba), confirma y toca **Enviar TMXN desde mi wallet**. El anchor detecta el pago en Stellar por su memo y manda el SPEI (simulado en la demo).",
    next: ["memo", "tarda"] },
  { id: "tarda", q: "¿Cuánto tarda?", keys: ["tarda", "tiempo", "rapido", "segundos", "demora"],
    a: "El pago en Stellar se confirma en **unos 5 segundos**. En la demo el depósito queda listo en menos de 10 s después de simular el SPEI, y el retiro unos segundos después de que tu wallet envía el pago.", next: ["ver"] },
  { id: "memo", q: "¿Qué es el memo?", keys: ["memo", "referencia"],
    a: "Es una etiqueta que viaja con el pago en Stellar. El anchor la usa para saber **qué retiro estás pagando**. La demo la pone sola; si pagas desde otra wallet, cópiala tal cual.", next: ["retirar"] },
  { id: "custodia", q: "¿SEPuente guarda mi dinero o mis llaves?", keys: ["custodia", "guarda", "llave", "seguro", "segur", "privada", "roban"],
    a: "**No.** SEPuente nunca recibe tus llaves ni guarda fondos: cada pago en Stellar lo firma tu wallet. Con la llave en el navegador, la llave vive solo en tu pestaña; con correo, la resguarda Pollar.", next: ["correo", "que"] },
  { id: "correo", q: "¿Cómo entro con mi correo?", keys: ["correo", "email", "pollar", "verific"],
    a: "En la demo elige **Con mi correo**, escribe tu correo y el código de 6 dígitos que te llega. Pollar crea tu wallet de Stellar; no instalas nada.",
    links: [{ href: "/demo", label: "Ir a la demo" }], next: ["codigo", "custodia"] },
  { id: "codigo", q: "No me llega el código", keys: ["no llega", "no me llega", "codigo", "spam", "no recibo"],
    a: "Revisa **spam o promociones** y espera un minuto. Luego usa **Reenviar código** (se activa a los 30 s) o **Cambiar correo** si lo escribiste mal. Si sigue sin llegar, usa **Llave en el navegador**: funciona igual sin correo.", next: ["correo"] },
  { id: "error", q: "Me salió un error", keys: ["error", "fallo", "no funciona", "insufficient", "no se pudo", "falla"],
    a: "La mayoría se arregla reintentando: la demo espera a que la red confirme tu cuenta y, si Pollar no cubre una reserva, te envía XLM de prueba sola. Si el error sigue, usa **Llave en el navegador**, que no depende de terceros. El faucet permite 3 solicitudes por día por cuenta.", next: ["ahora"] },
  { id: "trustline", q: "¿Qué es una trustline?", keys: ["trustline", "linea de confianza", "activar"],
    a: "Es el permiso que da tu wallet para recibir un token específico, aquí TMXN. Se activa **una sola vez** y reserva 0.5 XLM en tu cuenta.", next: ["xlm"] },
  { id: "sep", q: "¿Qué son SEP-10 y SEP-24?", keys: ["sep", "sep-10", "sep-24", "sep-38", "estandar", "protocolo"],
    a: "Estándares de Stellar. **SEP-10**: tu wallet firma un reto para iniciar sesión sin contraseña. **SEP-24**: la pantalla interactiva de depósito y retiro. **SEP-38**: cotizaciones. SEPuente pasa **75 de 76** pruebas oficiales de SDF.",
    links: [{ href: "/devs", label: "Ver documentación" }], next: ["integrar"] },
  { id: "stellar", q: "¿Por qué Stellar?", keys: ["por que stellar", "stellar", "blockchain", "red", "otra cadena"],
    a: "Porque Stellar ya tiene un **estándar de rampas** (anchors y SEP-24): una wallet integra una vez y funciona con cualquier anchor. Además, emitir el peso es nativo y cada pago tarda unos 5 segundos y cuesta una fracción de centavo.", next: ["sep", "integrar"] },
  { id: "ver", q: "¿Dónde veo mi transacción?", keys: ["transaccion", "hash", "explorador", "stellar.expert", "comprobante"],
    a: "En el **Historial** de la demo, cada operación completada tiene un enlace a stellar.expert (testnet) con la transacción real.", next: ["real"] },
  { id: "integrar", q: "¿Cómo lo integro en mi wallet?", keys: ["integr", "desarrollador", "api", "endpoint", "codigo abierto", "github"],
    a: "Apunta tu wallet SEP-24 a **sepuente.vercel.app**: los endpoints están en /.well-known/stellar.toml. El código es MIT.",
    links: [{ href: "/devs", label: "Documentación" }, { href: "https://github.com/ALFA117/sepuente", label: "GitHub" }], next: ["sep"] },
];
const byId = (id: string) => FAQ.find((f) => f.id === id)!;
const DEFAULT_CHIPS = ["ahora", "que", "real", "comision", "custodia", "codigo"];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,]/g, " ");

function match(text: string): Faq | null {
  const t = norm(text);
  let best: Faq | null = null, score = 0;
  for (const f of FAQ) {
    const s = f.keys.reduce((n, k) => n + (t.includes(norm(k)) ? norm(k).length : 0), 0) + (norm(f.q).trim() === t.trim() ? 100 : 0);
    if (s > score) { score = s; best = f; }
  }
  return best;
}

// "¿Qué hago ahora?" depende de en qué paso va la persona en la demo.
function answerNow(): { text: string; links?: Link[] } {
  const d = (typeof window !== "undefined" ? (window as unknown as { __sepuenteDemo?: DemoState }).__sepuenteDemo : undefined);
  if (!d) return { text: "Abre la demo: en 2 minutos creas una wallet de prueba, recibes pesos digitales y los regresas a tu banco (simulado).", links: [{ href: "/demo", label: "Abrir la demo" }] };
  if (d.step === 1) return { text: d.isEmail ? "Estás en el **paso 1**: escribe tu correo, toca **Enviar código** y escribe los 6 dígitos que te lleguen." : "Estás en el **paso 1**: toca **Obtener saldo de prueba** para recibir XLM de testnet." };
  if (d.step === 2) return { text: "Vas en el **paso 2**: toca **Activar pesos digitales** para que tu wallet pueda recibir TMXN." };
  if (d.step === 3) return { text: "Vas en el **paso 3**: toca **Conectar mi wallet**. Tu wallet firma un reto y quedas conectado al anchor." };
  if (d.pending) return { text: "Tienes una **operación en curso**. Revisa el Historial: si es un retiro esperando pago, toca **Enviar TMXN al anchor**." };
  if (!d.hasTmxn) return { text: "¡Listo para operar! Empieza con un **Depósito**: escribe 250, confirma y toca **Simular SPEI recibido**." };
  return { text: d.ops ? `Ya completaste **${d.ops} operación${d.ops === 1 ? "" : "es"}**. Prueba un **Retiro** a tu CLABE, o revisa cada pago en stellar.expert desde el Historial.` : "Ya tienes TMXN. Prueba un **Retiro**: toca Retirar, usa la CLABE de prueba y envía los TMXN desde tu wallet." };
}

function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>)}</>;
}

interface Msg { id: number; from: "bot" | "user"; text: string; links?: Link[]; next?: string[] }
const GREETING: Msg = { id: 0, from: "bot", text: "Hola, soy la ayuda de SEPuente. Elige una pregunta o escribe la tuya. Si estás en la demo, pregúntame **¿Qué hago ahora?**" };
const STORE = "sp_helpchat";

export function HelpChat() {
  const path = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [nudge, setNudge] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const nextId = useRef(1);

  // La conversación sobrevive al cambiar de página dentro de la pestaña.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null") as Msg[] | null;
      if (saved?.length) { setMsgs(saved); nextId.current = Math.max(...saved.map((m) => m.id)) + 1; }
    } catch { /* sin almacenamiento: empieza de cero */ }
  }, []);
  useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30))); } catch { /* ignorar */ } }, [msgs]);

  // Un saludo discreto una sola vez por navegador, a los 4 s.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem("sp_helpchat_seen") === "1"; } catch { /* ignorar */ }
    if (seen) return;
    const t = setTimeout(() => setNudge(true), 4000);
    return () => clearTimeout(t);
  }, []);
  const dismissNudge = () => { setNudge(false); try { localStorage.setItem("sp_helpchat_seen", "1"); } catch { /* ignorar */ } };

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" }); }, [msgs, typing, open, reduce]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80);
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
    const reply: Omit<Msg, "id"> = !f
      ? { from: "bot", text: "No tengo una respuesta para eso todavía. Prueba con una de estas preguntas o revisa la documentación.", links: [{ href: "/devs", label: "Documentación" }], next: ["ahora", "que", "error"] }
      : f.id === "ahora"
        ? { from: "bot", ...answerNow(), next: f.next }
        : { from: "bot", text: f.a, links: f.links, next: f.next };
    const delay = reduce ? 0 : Math.min(900, 300 + reply.text.length * 3);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: nextId.current++, ...reply }]); }, delay);
  };

  const reset = () => { setMsgs([GREETING]); nextId.current = 1; };

  const last = [...msgs].reverse().find((m) => m.from === "bot");
  const asked = new Set(msgs.filter((m) => m.from === "user").map((m) => m.text));
  const chipIds = [...(last?.next ?? []), ...DEFAULT_CHIPS].filter((id, i, a) => a.indexOf(id) === i && (id === "ahora" || !asked.has(byId(id).q))).slice(0, 5);

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
                <span className={styles.online} />
              </span>
              <div className={styles.titles}>
                <strong>Ayuda SEPuente</strong>
                <span>Respuestas fijas · no es IA</span>
              </div>
              {msgs.length > 1 && (
                <button type="button" className={styles.iconBtn} onClick={reset} aria-label="Empezar de nuevo" title="Empezar de nuevo">
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                </button>
              )}
              <button type="button" className={styles.iconBtn} onClick={() => { setOpen(false); btnRef.current?.focus(); }} aria-label="Cerrar ayuda">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </header>

            <div ref={listRef} className={styles.list} aria-live="polite">
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.div
                    key={m.id}
                    className={`${styles.msg} ${m.from === "user" ? styles.user : styles.bot}`}
                    initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    <p><Rich text={m.text} /></p>
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

            {chipIds.length > 0 && (
              <div className={styles.chips} role="group" aria-label="Preguntas sugeridas">
                {chipIds.map((id) => {
                  const f = byId(id);
                  return (
                    <button key={id} type="button" className={`${styles.chip} ${id === "ahora" ? styles.chipHot : ""}`} onClick={() => ask(f.q, f)} disabled={typing}>{f.q}</button>
                  );
                })}
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
                enterKeyHint="send"
              />
              <button type="submit" className={styles.send} disabled={!input.trim() || typing} aria-label="Enviar pregunta">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nudge && !open && (
          <motion.button
            type="button"
            className={styles.nudge}
            onClick={() => { dismissNudge(); setOpen(true); }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            ¿Dudas? Pregúntame
          </motion.button>
        )}
      </AnimatePresence>

      <motion.button
        ref={btnRef}
        type="button"
        className={styles.fab}
        onClick={() => { dismissNudge(); setOpen((o) => !o); }}
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
