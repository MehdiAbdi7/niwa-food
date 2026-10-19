"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

/**
 * Vrai quand le visiteur a demandé moins d'animations.
 *
 * Suivi en direct et non lu une fois : sur iOS, le réglage se bascule
 * pendant que la page est ouverte. Côté serveur la préférence est inconnue,
 * `false` jusqu'à l'hydratation, puis React relit la vraie valeur.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
