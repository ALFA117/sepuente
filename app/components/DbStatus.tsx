"use client";
import { useEffect, useState } from "react";
import { ui, Icon } from "./ui";

let shared: Promise<boolean | null> | null = null;

/**
 * ¿La base de datos del anchor responde? (GET /api/health, una sola petición por página).
 * true/false según el servidor; null si no se pudo saber (sin red): en ese caso no se bloquea nada
 * y el propio endpoint responde 503 con un mensaje claro si la base está caída.
 */
export function fetchDbUp(): Promise<boolean | null> {
  shared ??= fetch("/api/health")
    .then((r) => (r.ok ? r.json() : { db: false }))
    .then((d: { db?: boolean }) => d.db !== false)
    .catch(() => { shared = null; return null; });
  return shared;
}

export function useDbUp(): boolean | null {
  const [up, setUp] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetchDbUp().then((v) => { if (alive) setUp(v); });
    return () => { alive = false; };
  }, []);
  return up;
}

/** Aviso que solo aparece mientras la base no responde: depósitos y retiros en pausa. */
export function DbPauseNote({ className = "" }: { className?: string }) {
  const up = useDbUp();
  if (up !== false) return null;
  return (
    <div className={`${ui.notice} ${className}`} role="status">
      {Icon.alert(16)}
      <span>
        <strong>Depósitos y retiros en pausa.</strong> La base de datos de la demo no está disponible por ahora.
        Crear la wallet, activar los pesos digitales y conectarse con SEP-10 sí funcionan.
      </span>
    </div>
  );
}
