"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./EmailVerify.module.css";
import { ui, Icon, Spinner } from "../components/ui";
import { EASE_OUT } from "../components/motion";
import { waitForStep, pollarErrorText, type PollarWallet } from "./pollar";

const LEN = 6;
const RESEND_S = 30;

export function maskEmail(e: string) {
  const [u, d] = e.split("@");
  if (!d) return e;
  return `${u.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(u.length - 2, 6)))}@${d}`;
}

/**
 * Verificación de correo con Pollar: correo → código de 6 dígitos → wallet Stellar lista.
 * Pollar crea y resguarda la wallet (MPC); SEPuente solo recibe la dirección pública y las firmas.
 */
export function EmailVerify({ pw }: { pw: PollarWallet }) {
  const reduce = useReducedMotion();
  const { client, state } = pw;
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [localErr, setLocalErr] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [starting, setStarting] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);

  const prev = state.step === "error" ? state.previousStep : "";
  const stage: "email" | "code" | "done" =
    state.step === "authenticated" ? "done"
    : state.step === "entering_code" || state.step === "verifying_email_code" || (state.step === "error" && /verif|code/.test(prev)) ? "code"
    : "email";
  const sending = starting || state.step === "sending_email" || state.step === "creating_session";
  const verifying = state.step === "verifying_email_code" || state.step === "authenticating";
  const sentTo = state.step === "entering_code" || state.step === "verifying_email_code" ? state.email : state.step === "error" ? state.email ?? email : email;
  const err = localErr || pollarErrorText(state);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Al llegar al paso del código, enfoca la primera casilla. Si el código fue incorrecto, limpia y vuelve a enfocar.
  useEffect(() => {
    if (stage !== "code") return;
    if (state.step === "entering_code" || (state.step === "error" && state.errorCode === "EMAIL_CODE_INVALID")) {
      if (state.step === "error") setDigits(Array(LEN).fill(""));
      setTimeout(() => boxes.current[0]?.focus(), 60);
    }
  }, [stage, state]);

  const sendCode = async (to: string) => {
    if (!client) return;
    setLocalErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      setLocalErr("Escribe un correo válido, por ejemplo nombre@correo.com.");
      emailRef.current?.focus();
      return;
    }
    setStarting(true);
    try {
      // Cada envío abre una sesión de login nueva en Pollar (también al reenviar).
      client.beginEmailLogin();
      const s = await waitForStep(client, ["entering_email"]);
      if (s.step !== "entering_email") return;
      client.sendEmailCode(to.trim());
      await waitForStep(client, ["entering_code"]);
      setDigits(Array(LEN).fill(""));
      setCooldown(RESEND_S);
    } catch (e) {
      setLocalErr((e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const submitCode = (code: string) => {
    if (!client || code.length !== LEN || verifying) return;
    setLocalErr("");
    try { client.verifyEmailCode(code); }
    catch { setLocalErr("Pide un código nuevo para continuar."); }
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) { fill(clean, i); return; }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < LEN - 1) boxes.current[i + 1]?.focus();
    if (next.every(Boolean)) submitCode(next.join(""));
  };

  const fill = (text: string, from = 0) => {
    const next = [...digits];
    for (let k = 0; k < text.length && from + k < LEN; k++) next[from + k] = text[k];
    setDigits(next);
    boxes.current[Math.min(from + text.length, LEN - 1)]?.focus();
    if (next.every(Boolean)) submitCode(next.join(""));
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = ""; setDigits(next);
      boxes.current[i - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < LEN - 1) boxes.current[i + 1]?.focus();
  };

  const changeEmail = () => {
    setLocalErr("");
    setDigits(Array(LEN).fill(""));
    client?.cancelLogin();
    setTimeout(() => emailRef.current?.focus(), 60);
  };

  const anim = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12, transition: { duration: 0.14 } } };

  if (!client) {
    return (
      <div className={styles.box}>
        {pw.loadError
          ? <div className={ui.alert} role="alert">{Icon.alert(16)}<span>{pw.loadError}</span></div>
          : <span className={styles.loading}><Spinner />Conectando con Pollar…</span>}
      </div>
    );
  }

  return (
    <div className={styles.box}>
      <ol className={styles.track} aria-label="Progreso de la verificación">
        {["Correo", "Código", "Wallet"].map((t, i) => {
          const at = stage === "email" ? 0 : stage === "code" ? 1 : 3;
          return (
            <li key={t} data-state={i < at ? "done" : i === at ? "active" : "todo"}>
              <span className={styles.trackDot}>{i < at ? Icon.check(11) : i + 1}</span>
              <span>{t}</span>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        {stage === "email" && (
          <motion.form
            key="email"
            className={styles.pane}
            {...anim}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            onSubmit={(e) => { e.preventDefault(); sendCode(email); }}
            noValidate
          >
            <label className={ui.field}>
              <span className={ui.label}>Tu correo</span>
              <input
                ref={emailRef}
                className={ui.input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLocalErr(""); }}
                aria-invalid={!!err || undefined}
                aria-describedby="ev-hint"
                disabled={sending}
                required
              />
              <span id="ev-hint" className={ui.hint}>Te enviamos un código de {LEN} dígitos. Sin contraseñas.</span>
            </label>
            {err && <p className={styles.err} role="alert">{Icon.alert(14)}{err}</p>}
            <button type="submit" className={`${ui.btn} ${ui.primary} ${styles.cta}`} disabled={sending} aria-busy={sending}>
              {sending ? <><Spinner />Enviando código…</> : "Enviar código"}
            </button>
          </motion.form>
        )}

        {stage === "code" && (
          <motion.form
            key="code"
            className={styles.pane}
            {...anim}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            onSubmit={(e) => { e.preventDefault(); submitCode(digits.join("")); }}
          >
            <p className={styles.sent}>
              {Icon.check(14)}
              <span>Enviamos un código a <strong>{maskEmail(sentTo)}</strong>. Revisa también spam.</span>
            </p>
            <fieldset className={styles.otpSet} disabled={verifying}>
              <legend className={ui.label}>Código de verificación</legend>
              <div className={styles.otp} onPaste={(e) => { e.preventDefault(); fill(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN)); }}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxes.current[i] = el; }}
                    className={styles.otpBox}
                    data-filled={!!d || undefined}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    pattern="[0-9]*"
                    maxLength={i === 0 ? LEN : 1}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Dígito ${i + 1} de ${LEN}`}
                    aria-invalid={!!err || undefined}
                  />
                ))}
              </div>
            </fieldset>
            {err && <p className={styles.err} role="alert">{Icon.alert(14)}{err}</p>}
            <button type="submit" className={`${ui.btn} ${ui.primary} ${styles.cta}`} disabled={verifying || digits.some((x) => !x)} aria-busy={verifying}>
              {verifying ? <><Spinner />Verificando y creando tu wallet…</> : "Verificar"}
            </button>
            <div className={styles.links}>
              <button type="button" className={ui.linkBtn} onClick={() => sendCode(sentTo)} disabled={cooldown > 0 || sending || verifying}>
                {sending ? "Reenviando…" : cooldown > 0 ? `Reenviar código en ${cooldown} s` : "Reenviar código"}
              </button>
              <button type="button" className={ui.linkBtn} onClick={changeEmail} disabled={verifying}>Cambiar correo</button>
            </div>
          </motion.form>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            className={`${styles.pane} ${styles.done}`}
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <span className={styles.doneIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.1 }} />
              </svg>
            </span>
            <div>
              <strong>Correo verificado</strong>
              <p>{pw.email ? maskEmail(pw.email) : "Tu correo"} · wallet Stellar creada con Pollar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
