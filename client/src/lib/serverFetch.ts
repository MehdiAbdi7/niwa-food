import { cookies } from "next/headers";
import type { ApiEnvelope } from "@/types/api";

export const AUTH_COOKIE_NAME = "niwa_token";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface ServerFetchOptions {
  // Durée de cache Next en secondes. 0 = jamais mis en cache (défaut, correct
  // pour des données de service qui changent en permanence).
  revalidate?: number;
  tags?: string[];
}

/**
 * Appelle l'API depuis un Server Component en réémettant le cookie de session.
 *
 * Le piège que ça résout : un Server Component s'exécute sur le serveur Next,
 * pas dans le navigateur. Le cookie du visiteur n'est donc PAS joint
 * automatiquement à l'appel sortant vers l'API — il faut le relire via
 * cookies() et le poser à la main dans l'en-tête.
 *
 * Renvoie null sur 401/403 plutôt que de lever : au niveau de l'appelant,
 * « pas autorisé » est une réponse, pas un incident. Les vraies erreurs
 * (500, réseau) remontent et déclenchent error.tsx.
 */
export async function serverFetch<T>(
  path: string,
  { revalidate = 0, tags }: ServerFetchOptions = {},
): Promise<T | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `${AUTH_COOKIE_NAME}=${token}` } : {}),
    },
    next: { revalidate, ...(tags ? { tags } : {}) },
  });

  if (response.status === 401 || response.status === 403) return null;

  if (!response.ok) {
    throw new Error(`API ${path} — ${response.status}`);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}
