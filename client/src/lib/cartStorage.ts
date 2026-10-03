import type { CartLine } from "./cartLine";

const STORAGE_KEY = "niwa_cart";

// Incrémenter dès que la forme de CartLine change : un panier écrit par
// l'ancien code est alors rejeté d'un bloc, au lieu de produire un objet à
// moitié valide qui planterait au calcul du total.
const STORAGE_VERSION = 1;

// Au-delà d'une journée, un panier n'a plus de sens : le menu a pu changer,
// et le client qui revient ne se souvient de toute façon pas de ce qu'il
// avait composé.
const TTL_MS = 24 * 60 * 60 * 1000;

interface StoredCart {
  version: number;
  savedAt: number;
  lines: CartLine[];
}

/**
 * Lit le panier stocké, ou null s'il n'y a rien d'exploitable.
 *
 * Cette donnée vient du disque de l'utilisateur, donc de l'extérieur : elle
 * est validée en forme avant d'être rendue, exactement comme les paramètres
 * d'URL dans useOrderContext. Un JSON bricolé à la main ne doit pas casser
 * la page, juste ramener à un panier vide.
 */
export function readStoredCart(): CartLine[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredCart>;

    if (parsed.version !== STORAGE_VERSION) {
      clearStoredCart();
      return null;
    }

    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > TTL_MS
    ) {
      clearStoredCart();
      return null;
    }

    if (!Array.isArray(parsed.lines)) {
      clearStoredCart();
      return null;
    }

    // Garde minimale sur chaque ligne : tout le reste du code suppose ces
    // champs présents (getLineUnitPrice lit variant.price, buildCartLineKey
    // lit extras...). Une ligne incomplète est écartée, pas réparée.
    return parsed.lines.filter(
      (line): line is CartLine =>
        typeof line?.key === "string" &&
        typeof line?.menuItemId === "string" &&
        typeof line?.name === "string" &&
        typeof line?.quantity === "number" &&
        line.quantity > 0 &&
        typeof line?.variant?.price === "number" &&
        Array.isArray(line?.extras) &&
        Array.isArray(line?.excludedIngredients),
    );
  } catch {
    // JSON illisible, localStorage indisponible (navigation privée stricte,
    // cookies bloqués...) : on repart d'un panier vide plutôt que de lever.
    return null;
  }
}

export function writeStoredCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;

  try {
    // Panier vidé = entrée supprimée, et non `lines: []`. Sinon chaque
    // vidage repousserait le TTL et laisserait une clé morte indéfiniment.
    if (lines.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload: StoredCart = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      lines,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota dépassé ou stockage refusé : le panier reste en mémoire, il ne
    // survivra simplement pas au rafraîchissement. Rien à signaler au client.
  }
}

export function clearStoredCart(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem
  }
}
