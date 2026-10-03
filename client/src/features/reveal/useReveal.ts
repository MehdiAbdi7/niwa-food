"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Vrai quand l'API n'est pas disponible : mieux vaut du contenu visible sans
 * animation qu'une section invisible pour de bon.
 *
 * Testé dans l'initialiseur de useState et non dans un effet — un setState
 * synchrone dans un effet déclenche un rendu supplémentaire, et le contenu
 * apparaîtrait avec une frame de retard sans aucune raison.
 *
 * `typeof window === "undefined"` d'abord : au rendu serveur on renvoie false,
 * donc le HTML part avec l'état masqué, identique à ce que le client rendra
 * au premier passage. Sans ce garde, l'hydratation divergerait.
 */
function shouldSkipObserver(): boolean {
  if (typeof window === "undefined") return false;
  return typeof IntersectionObserver === "undefined";
}

/**
 * Signale l'entrée d'un élément dans le viewport, une seule fois.
 *
 * L'observer se déconnecte au premier passage : rejouer l'animation à chaque
 * remontée transformerait un scroll de relecture en diaporama.
 *
 * Seuil volontairement bas : sur des sections aussi hautes que les nôtres,
 * un threshold de 0.15 n'est atteint qu'une fois la section à mi-écran, et
 * l'animation se déclenche alors sous les yeux du visiteur au lieu de
 * l'accueillir.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0,
  rootMargin = "0px 0px -12% 0px",
}: Options = {}) {
  const ref = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(shouldSkipObserver);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsRevealed(true);
        observer.disconnect();
      },
      { threshold, rootMargin },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isRevealed };
}
