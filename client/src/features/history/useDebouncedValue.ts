"use client";

import { useEffect, useState } from "react";

/**
 * Retarde la propagation d'une valeur qui change vite.
 *
 * Sans ça, taper « Yacine » déclencherait six requêtes d'historique — dont
 * cinq dont personne ne lira jamais le résultat. Le champ de saisie, lui,
 * reste piloté par la valeur brute : la frappe ne doit JAMAIS être retardée,
 * seul l'appel réseau l'est.
 *
 * Le setState vit dans le callback du timer, pas dans le corps de l'effet :
 * il n'y a donc pas de rendu supplémentaire déclenché au montage, et la règle
 * `react-hooks/set-state-in-effect` ne s'applique pas.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    // Nettoyage à chaque frappe : c'est CE return qui fait le debounce. Sans
    // lui, on empilerait un timer par caractère et ils se déclencheraient
    // tous, l'un après l'autre.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
