export type Tone = "neutral" | "warning" | "info" | "success" | "danger";

export const TX_STATUS: Record<string, { label: string; tone: Tone }> = {
  incomplete: { label: "Sin iniciar", tone: "neutral" },
  pending_user_transfer_start: { label: "Esperando tu pago", tone: "warning" },
  pending_anchor: { label: "Procesando", tone: "info" },
  pending_stellar: { label: "Enviando en Stellar", tone: "info" },
  completed: { label: "Completado", tone: "success" },
  error: { label: "Error", tone: "danger" },
  expired: { label: "Expirado", tone: "danger" },
  refunded: { label: "Reembolsado", tone: "neutral" },
};

export function txStatus(status: string) {
  return TX_STATUS[status] ?? { label: status.replace(/_/g, " "), tone: "neutral" as Tone };
}

export const PENDING_STATUSES = ["pending_user_transfer_start", "pending_anchor", "pending_stellar"];
