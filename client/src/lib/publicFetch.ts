import type { ApiEnvelope } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Lecture d'une ressource publique depuis un Server Component.
 *
 * Volontairement distinct de serverFetch : celui-ci appelle cookies(), ce qui
 * bascule toute la page en rendu dynamique. Ici il n'y a rien à authentifier,
 * donc la page peut être générée une fois et resservie en ISR — c'est ce qui
 * fait qu'un client qui scanne le QR reçoit le menu en HTML immédiatement,
 * sans attendre le JS ni un aller-retour API.
 *
 * Renvoie null au lieu de lever : un menu indisponible est un état d'écran,
 * pas un crash.
 */
export async function publicFetch<T>(
  path: string,
  revalidate = 60,
): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!response.ok) return null;

    const envelope = (await response.json()) as ApiEnvelope<T>;
    return envelope.data;
  } catch {
    return null;
  }
}
