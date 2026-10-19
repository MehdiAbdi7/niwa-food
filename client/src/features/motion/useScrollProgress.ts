"use client";

import { useEffect, useRef, type RefObject } from "react";

interface Options {
  /** Position du HAUT de l'élément, en fraction de l'écran, où p vaut 0. */
  start?: number;
  /** Position du BAS de l'élément, en fraction de l'écran, où p vaut 1. */
  end?: number;
  /** Faux : aucun écouteur, onProgress n'est jamais appelé. */
  enabled?: boolean;
}

/**
 * Appelle onProgress(p) avec l'avancement du défilement sur un élément,
 * p allant de 0 à 1.
 *
 * Avec les valeurs par défaut, p vaut 0 quand le haut de l'élément arrive
 * à 85 % de la hauteur de l'écran, et 1 quand son bas remonte à 55 %.
 *
 * Le résultat n'est PAS un state React : onProgress écrit directement dans
 * le DOM (une variable CSS, un attribut). Un setState par image de défilement
 * relancerait le rendu du composant 60 fois par seconde.
 *
 * Trois économies :
 * - un IntersectionObserver coupe l'écoute tant que l'élément est loin de
 *   l'écran ;
 * - le calcul attend la prochaine image (requestAnimationFrame) : dix
 *   événements scroll entre deux images ne coûtent qu'un calcul ;
 * - l'écouteur est passif, il ne peut pas retarder le défilement.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
  { start = 0.85, end = 0.55, enabled = true }: Options = {},
) {
  // Toujours la dernière version du callback, sans relancer l'effet à
  // chaque rendu du composant appelant.
  const callbackRef = useRef(onProgress);
  useEffect(() => {
    callbackRef.current = onProgress;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    let frameId = 0;

    const measure = () => {
      frameId = 0;
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const distance = rect.height + (start - end) * viewport;
      const raw = (start * viewport - rect.top) / distance;
      callbackRef.current(Math.min(1, Math.max(0, raw)));
    };

    const schedule = () => {
      if (frameId === 0) frameId = requestAnimationFrame(measure);
    };

    // Marge d'un demi-écran : la mesure démarre un peu avant que l'élément
    // n'apparaisse, il arrive donc déjà dans le bon état.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", schedule, { passive: true });
          window.addEventListener("resize", schedule);
          schedule();
        } else {
          window.removeEventListener("scroll", schedule);
          window.removeEventListener("resize", schedule);
          // Sorti par le haut à toute vitesse : le dernier événement a pu
          // être sauté, on fige l'état final plutôt qu'un état intermédiaire.
          measure();
        }
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frameId !== 0) cancelAnimationFrame(frameId);
    };
  }, [ref, start, end, enabled]);
}
