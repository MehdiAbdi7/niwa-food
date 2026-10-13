"use client";

import { useEffect, useRef } from "react";
import type { SpyAnchor } from "./menuBlocks";

// Le seuil de bascule : une section devient « active » quand son titre passe
// au-dessus du tiers haut de l'écran. Plus bas, on activerait Pizzas alors que
// le client lit encore les derniers tacos ; plus haut, la bascule arriverait
// avant que la section ne soit vraiment lisible.
const ACTIVATION_RATIO = 0.32;

// Pendant un défilement lancé par un clic, l'espion se met en pause. Sans
// cela, chaque section traversée rallumait sa catégorie en chemin, et sur
// mobile la barre changeait de hauteur en plein trajet (sous-catégories qui
// apparaissent puis disparaissent) : le titre visé arrivait décalé.
let isPaused = false;
let resumeTimer = 0;
let resumeListener: (() => void) | null = null;

function pauseSpyUntilScrollStops() {
  // Deux clics rapprochés : on remplace l'attente en cours au lieu d'en
  // empiler une seconde.
  if (resumeListener) window.removeEventListener("scroll", resumeListener);
  isPaused = true;

  const resume = () => {
    window.removeEventListener("scroll", resumeLater);
    resumeListener = null;
    isPaused = false;
    // Une mesure à l'arrivée : c'est elle qui rallume la bonne
    // sous-catégorie, puisque rien n'a été mesuré pendant le trajet.
    window.dispatchEvent(new Event("scroll"));
  };

  // 150 ms sans aucun événement scroll : le défilement est terminé. Plus sûr
  // que l'événement "scrollend", que Safari ne gère pas encore.
  const resumeLater = () => {
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(resume, 150);
  };

  resumeListener = resumeLater;
  window.addEventListener("scroll", resumeLater, { passive: true });

  // Filet de sécurité : si la page ne bouge pas du tout (on est déjà sur la
  // section), aucun événement scroll n'arrive. Le compte à rebours de 150 ms
  // ne démarre donc qu'au premier mouvement, et pas avant le défilement.
  window.clearTimeout(resumeTimer);
  resumeTimer = window.setTimeout(resume, 1000);
}

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
      if (isPaused) return;

      const list = anchorsRef.current;
      if (list.length === 0) return;

      const threshold = window.innerHeight * ACTIVATION_RATIO;
      let current = list[0];

      for (const anchor of list) {
        const element = document.getElementById(anchor.id);
        if (!element) continue;

        // Un clic fait atterrir l'ancre à sa marge (scroll-margin-top). Sur
        // mobile, cette marge (header + barre des catégories) dépasse le
        // seuil : sans ce max, la section visée ne s'allumait pas à
        // l'arrivée. +2 px absorbent les arrondis du navigateur.
        const scrollMargin = parseFloat(
          getComputedStyle(element).scrollMarginTop,
        );
        const reachedAt = Math.max(threshold, scrollMargin + 2);

        if (element.getBoundingClientRect().top <= reachedAt) current = anchor;
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

  pauseSpyUntilScrollStops();

  // Deux images d'attente avant de défiler : le clic vient peut-être de
  // changer la forme de la barre mobile (voir MenuFilters). Image 1 : React a
  // mis la page à jour, et ResizeObserver publie la nouvelle hauteur de la
  // barre. Image 2 : on défile avec la bonne marge.
  //
  // Le décalage sous le header et la barre est porté par les classes
  // scroll-mt-* des titres, pas calculé ici : une valeur en dur divergerait
  // dès qu'on touche à la hauteur d'un des deux.
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      }),
    ),
  );
}
