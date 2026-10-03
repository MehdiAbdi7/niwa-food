// Seuils d'alerte pour une commande en attente : au-delà, la couleur du
// minuteur prévient l'équipe avant que le client ne s'impatiente.
const WARNING_THRESHOLD_MIN = 10;
const CRITICAL_THRESHOLD_MIN = 20;

export type ElapsedLevel = "normal" | "warning" | "critical";

export function getElapsedMinutes(sinceIso: string): number {
  return Math.floor((Date.now() - new Date(sinceIso).getTime()) / 60000);
}

export function getElapsedLevel(minutes: number): ElapsedLevel {
  if (minutes >= CRITICAL_THRESHOLD_MIN) return "critical";
  if (minutes >= WARNING_THRESHOLD_MIN) return "warning";
  return "normal";
}

export function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${rest.toString().padStart(2, "0")}`;
}
