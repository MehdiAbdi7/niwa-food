const STORAGE_KEY = "niwa_last_order";

// Le temps d'un service : au-delà, la commande est encaissée depuis longtemps
// et proposer son suivi n'a plus de sens.
const TTL_MS = 6 * 60 * 60 * 1000;

// Émis après chaque écriture. L'événement "storage" natif ne se déclenche que
// dans les AUTRES onglets : sans ce signal maison, l'onglet qui vient de
// passer commande ne saurait pas que quelque chose a changé.
const CHANGE_EVENT = "niwa:last-order";

export interface LastOrderRef {
  id: string;
  dailyNumber: number;
  savedAt: number;
}

function notify(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Mémorise la dernière commande passée, pour que le client retrouve son suivi
 * après avoir fermé l'onglet — c'est le seul lien qu'il possède vers elle,
 * puisqu'il n'a pas de compte.
 */
export function readLastOrder(): LastOrderRef | null {
  if (typeof window === "undefined") return null;

  try {
    return parseLastOrder(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeLastOrder(id: string, dailyNumber: number): void {
  if (typeof window === "undefined") return;

  try {
    const payload: LastOrderRef = { id, dailyNumber, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    notify();
  } catch {
    // Stockage refusé : le suivi reste accessible tant que l'onglet est ouvert.
  }
}

export function clearLastOrder(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notify();
  } catch {
    // idem
  }
}

/* ---------- Lecture via useSyncExternalStore ---------- */

/**
 * Instantané BRUT, volontairement : une chaîne de caractères.
 *
 * useSyncExternalStore rappelle cette fonction à chaque rendu et compare le
 * résultat avec Object.is. Renvoyer un objet fraîchement analysé donnerait une
 * référence neuve à chaque fois, donc une boucle de rendu infinie. La chaîne,
 * elle, est une primitive : identique tant que rien n'a changé.
 */
export function getLastOrderSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Instantané côté serveur : il n'y a pas de localStorage là-bas. React rend
// donc « rien », puis rebascule sur la valeur réelle après hydratation — sans
// jamais produire de divergence entre les deux rendus.
export function getLastOrderServerSnapshot(): string | null {
  return null;
}

export function subscribeLastOrder(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  // "storage" couvre le cas multi-onglets : commander dans l'un doit faire
  // apparaître le raccourci dans l'autre.
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Analyse un instantané brut. Séparé de la lecture pour être appelable depuis
 * un useMemo, une fois que la chaîne s'est stabilisée.
 *
 * Cette donnée vient du disque de l'utilisateur, donc de l'extérieur : elle
 * est validée en forme, exactement comme les paramètres d'URL.
 */
export function parseLastOrder(raw: string | null): LastOrderRef | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LastOrderRef>;

    if (
      typeof parsed.id !== "string" ||
      typeof parsed.dailyNumber !== "number" ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }

    // Périmé : on l'ignore sans purger ici. Supprimer serait un effet de bord
    // au milieu d'un rendu, et l'entrée disparaîtra d'elle-même à la prochaine
    // commande.
    if (Date.now() - parsed.savedAt > TTL_MS) return null;

    return parsed as LastOrderRef;
  } catch {
    return null;
  }
}
