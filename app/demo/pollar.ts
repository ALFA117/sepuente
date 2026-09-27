"use client";
import { useEffect, useState } from "react";
import type { AuthState, PollarClient } from "@pollar/core";

/** Llave publicable de Pollar (pub_testnet_…). Es pública por diseño: identifica la app, no firma nada. */
export const POLLAR_KEY = (process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY ?? "").trim();

let clientPromise: Promise<PollarClient> | null = null;

/** Un solo cliente por pestaña; se carga bajo demanda para no inflar la página cuando se usa la wallet local. */
export function getPollar(): Promise<PollarClient> {
  if (!clientPromise) {
    clientPromise = import("@pollar/core").then(async ({ PollarClient }) => {
      const c = new PollarClient({ apiKey: POLLAR_KEY, stellarNetwork: "testnet" });
      await c.ready();
      return c;
    });
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}

/** Espera a que el flujo de login llegue a uno de los pasos indicados (o a error). */
export function waitForStep(c: PollarClient, steps: AuthState["step"][], ms = 20000): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    const now = c.getAuthState();
    if (steps.includes(now.step)) return resolve(now);
    const t = setTimeout(() => { off(); reject(new Error("Pollar tardó demasiado en responder. Intenta de nuevo.")); }, ms);
    const off = c.onAuthStateChange((s) => {
      if (steps.includes(s.step) || s.step === "error") { clearTimeout(t); off(); resolve(s); }
    });
  });
}

const ERRORS: Record<string, string> = {
  EMAIL_SEND_FAILED: "No pudimos enviar el código. Revisa el correo e intenta de nuevo.",
  EMAIL_CODE_INVALID: "El código no es correcto. Revísalo e intenta otra vez.",
  EMAIL_CODE_EXPIRED: "El código expiró. Pide uno nuevo.",
  EMAIL_VERIFY_FAILED: "No pudimos verificar el código. Intenta de nuevo.",
  SESSION_CREATE_FAILED: "No se pudo iniciar la verificación con Pollar.",
  SESSION_EXPIRED: "La sesión expiró. Vuelve a verificar tu correo.",
  LOGIN_TIMEOUT: "La verificación tardó demasiado. Intenta de nuevo.",
};

export function pollarErrorText(s: AuthState): string {
  if (s.step !== "error") return "";
  return ERRORS[s.errorCode] ?? "Algo salió mal con la verificación. Intenta de nuevo.";
}

export interface PollarWallet {
  client: PollarClient | null;
  state: AuthState;
  address: string | null;
  email: string | null;
  verified: boolean;
  loadError: string;
}

/** Estado reactivo de la sesión de Pollar: paso del login, correo verificado y dirección Stellar de la wallet. */
export function usePollarWallet(enabled: boolean): PollarWallet {
  const [client, setClient] = useState<PollarClient | null>(null);
  const [state, setState] = useState<AuthState>({ step: "idle" });
  const [loadError, setLoadError] = useState("");
  const [, bump] = useState(0);

  useEffect(() => {
    if (!enabled || !POLLAR_KEY) return;
    let off: (() => void) | undefined;
    let alive = true;
    getPollar()
      .then((c) => {
        if (!alive) return;
        setClient(c);
        setState(c.getAuthState());
        off = c.onAuthStateChange((s) => { setState(s); bump((n) => n + 1); });
      })
      .catch(() => alive && setLoadError("No se pudo cargar Pollar. Revisa tu conexión o usa la wallet local."));
    return () => { alive = false; off?.(); };
  }, [enabled]);

  const authed = state.step === "authenticated";
  const address = authed && client ? client.getWallet()?.address ?? null : null;
  const email = client?.getUserProfile()?.providers.email?.address ?? client?.getUserProfile()?.mail ?? null;
  return { client, state, address, email: email || null, verified: authed && state.verified, loadError };
}
