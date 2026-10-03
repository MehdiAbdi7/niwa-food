"use client";

import { useEffect, useRef } from "react";
import type { SpyAnchor } from "./menuBlocks";

// Le seuil de bascule : une section devient « active » quand son titre passe
// au-dessus du tiers haut de l'écran. Plus bas, on activerait Pizzas alors que
// le client lit encore les derniers tacos ; plus haut, la bascule arriverait
// avant que la section ne soit vraiment lisible.
const ACTIVATION_RATIO = 0.32;

/**
 * Signale quelle section de la carte le client est en train de lire.
 *
 * Mesure directe à chaque frame de scroll plutôt qu'un IntersectionObserver :
 * l'observer demande une bande de déclenchement (rootMargin), et une section
 * courte — « Salades », un seul plat — peut traverser cette bande entre deux
 * frames sans jamais être signalée. Ici on lit la position de toutes les
 * ancres et on retient la dernière franchie : le résultat est déterministe,
 * quelle que soit la hauteur des sections ou la vitesse du geste.
 *
 * Le coût est contenu par le requestAnimationFrame (une mesure par frame au
 * maximum) et par le garde d'égalité (aucun rendu si l'ancre n'a pas changé).
 */
export function useSectionSpy(
  anchors: SpyAnchor[],
  onChange: (anchor: SpyAnchor) => void,
  enabled = true,
) {
  const anchorsRef = useRef(anchors);
  const onChangeRef = useRef(onChange);
  const lastIdRef = useRef<string | null>(null);

  // Déclarés AVANT l'effet principal : les effets s'exécutent dans l'ordre de
  // déclaration, donc les refs sont à jour quand la mesure démarre.
  useEffect(() => {
    anchorsRef.current = anchors;
  });

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Chaîne primitive : l'identité du tableau change à chaque rendu du parent,
  // la remonter en dépendance relancerait l'effet en boucle.
  const anchorsKey = anchors.map((anchor) => anchor.id).join("|");

  useEffect(() => {
    if (!enabled || anchorsKey === "") {
      lastIdRef.current = null;
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;

      const list = anchorsRef.current;
      if (list.length === 0) return;

      const threshold = window.innerHeight * ACTIVATION_RATIO;
      let current = list[0];

      for (const anchor of list) {
        const element = document.getElementById(anchor.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= threshold) current = anchor;
      }

      // Bas de page : la dernière section est souvent trop courte pour
      // franchir le seuil. Sans ce rattrapage, « Salades » ne s'allumerait
      // jamais, même en butée de scroll.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8;
      if (atBottom) current = list[list.length - 1] ?? current;

      if (!current || current.id === lastIdRef.current) return;

      lastIdRef.current = current.id;
      onChangeRef.current(current);
    };

    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    // Première mesure immédiate : à l'arrivée sur la page, la colonne doit
    // déjà désigner la première section.
    measure();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [anchorsKey, enabled]);
}

/** Défilement vers une ancre, en respectant la préférence de mouvement réduit. */
export function scrollToAnchor(id: string) {
  const element = document.getElementById(id);
  if (!element) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Le décalage sous la navbar et la barre de filtres est porté par les
  // classes scroll-mt-* des titres, pas calculé ici : une valeur en dur
  // divergerait dès qu'on touche à la hauteur d'un des deux.
  element.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}
