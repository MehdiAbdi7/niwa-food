"use client";

import { useCallback, useEffect, useRef } from "react";

const SETTLE_DELAY_MS = 140;
const AUTOPLAY_SPEED_PX_S = 38;
const RESUME_DELAY_MS = 2500;

interface Options {
  autoplay?: boolean;
}

/**
 * Défilement horizontal en boucle, avec dérive automatique.
 *
 * La liste est rendue trois fois par l'appelant ; le hook maintient le scroll
 * dans la copie centrale. Aucun index stocké : le navigateur reste seul maître
 * du `scrollLeft`, on ne fait que le recentrer et l'avancer.
 *
 * DEUX CONTRAINTES sur le conteneur, sous peine d'immobilité :
 *  - pas de scroll-snap (`snap-mandatory` ramènerait à l'ancre à chaque frame)
 *  - pas de `scroll-behavior: smooth` en CSS. Le setter scrollLeft respecte
 *    cette propriété : chaque frame lancerait une animation fluide annulant la
 *    précédente. Safari applique la règle strictement — le carrousel reste
 *    alors totalement figé sur iOS, alors qu'il avance sur Chrome.
 */
export function useInfiniteCarousel(
  itemCount: number,
  { autoplay = true }: Options = {},
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs et non state : ces valeurs changent à chaque frame ou à chaque geste,
  // les passer par useState provoquerait un rendu par mouvement de souris.
  const isPaused = useRef(false);
  const isVisible = useRef(true);

  // Reste fractionnaire de la dérive. scrollLeft arrondit sur certains
  // navigateurs : sans accumulateur, une avancée de 0,4 px par frame serait
  // arrondie à 0 et le carrousel ne bougerait jamais.
  const remainder = useRef(0);

  /** Écrit scrollLeft en forçant un déplacement INSTANTANÉ. */
  const setScrollLeft = useCallback((el: HTMLDivElement, left: number) => {
    const previous = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = left;
    el.style.scrollBehavior = previous;
  }, []);

  const jumpTo = useCallback(
    (left: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      setScrollLeft(el, left);
      remainder.current = 0;
    },
    [setScrollLeft],
  );

  /** Ramène le scroll dans la copie centrale s'il s'en est trop éloigné. */
  const normalize = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const copyWidth = el.scrollWidth / 3;

    // Pas encore mesurable, ou pas assez de contenu pour déborder : le
    // carrousel se comporte alors comme une simple rangée, sans boucle.
    if (copyWidth === 0 || el.scrollWidth <= el.clientWidth) return;

    if (el.scrollLeft < copyWidth * 0.5) {
      jumpTo(el.scrollLeft + copyWidth);
    } else if (el.scrollLeft > copyWidth * 1.5) {
      jumpTo(el.scrollLeft - copyWidth);
    }
  }, [jumpTo]);

  // Centrage initial. itemCount en dépendance : les produits arrivent après le
  // fetch RTK Query, la largeur n'existe pas encore au premier montage.
  useEffect(() => {
    if (itemCount === 0) return;

    const frame = requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (!el) return;
      jumpTo(el.scrollWidth / 3);
    });

    return () => cancelAnimationFrame(frame);
  }, [itemCount, jumpTo]);

  /* ---------- Pause / reprise ---------- */

  const resume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    isPaused.current = false;
  }, []);

  /**
   * Suspend, puis reprend seule après RESUME_DELAY_MS.
   *
   * TOUTE pause tactile passe par ici : sur mobile, un `touchend` peut ne
   * jamais être délivré au conteneur — le doigt quitte l'écran ailleurs, ou le
   * geste devient un scroll vertical de la page. Une pause sans échéance
   * propre laisserait l'autoplay figé pour de bon.
   */
  const pauseTemporarily = useCallback(() => {
    isPaused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      isPaused.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  /** Pause franche, sans reprise programmée — réservée au survol souris. */
  const pauseWhileHovering = useCallback(() => {
    isPaused.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  /* ---------- Boucle de dérive ---------- */

  useEffect(() => {
    if (!autoplay || itemCount === 0) return;

    const el = scrollerRef.current;
    if (!el) return;

    // Écouté en continu et non testé une fois : sur iOS, « Réduire les
    // animations » peut être basculé pendant que la page est ouverte.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Ne pas animer hors écran : calcul perdu, et batterie sur mobile.
    // isVisible démarre à true — si l'observer n'émettait jamais, le carrousel
    // tournerait quand même plutôt que de rester bloqué.
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(el);

    let frameId = 0;
    let lastTime = 0;

    const tick = (time: number) => {
      frameId = requestAnimationFrame(tick);

      // Premier passage, ou retour d'onglet après une longue absence : on
      // repart de zéro plutôt que d'appliquer un delta de plusieurs secondes.
      if (!lastTime || time - lastTime > 250) {
        lastTime = time;
        return;
      }

      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;

      if (motionQuery.matches) return;
      if (isPaused.current || !isVisible.current) return;
      if (el.scrollWidth <= el.clientWidth) return;

      const advance = AUTOPLAY_SPEED_PX_S * deltaSeconds + remainder.current;
      const whole = Math.floor(advance);
      remainder.current = advance - whole;

      if (whole > 0) {
        // setScrollLeft et non `el.scrollLeft +=` : voir l'avertissement en
        // tête de fichier. C'est ce qui bloquait totalement Safari iOS.
        setScrollLeft(el, el.scrollLeft + whole);
        // Recentrage à chaque frame, sans attendre : le debounce du geste
        // manuel ne se déclencherait jamais ici, les événements de scroll ne
        // s'arrêtant pas.
        normalize();
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [autoplay, itemCount, normalize, setScrollLeft]);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  /* ---------- Gestes manuels ---------- */

  const handleScroll = useCallback(() => {
    // Utile uniquement quand l'autoplay est en pause : sinon la boucle
    // ci-dessus a déjà recentré.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(normalize, SETTLE_DELAY_MS);
  }, [normalize]);

  const scrollByCard = useCallback(
    (direction: 1 | -1) => {
      const el = scrollerRef.current;
      if (!el) return;

      pauseTemporarily();

      // Le pas est mesuré sur la première carte plutôt que codé en dur : il
      // suit automatiquement les `basis-[...]` du breakpoint courant.
      const card = el.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const step = card ? card.offsetWidth + gap : el.clientWidth * 0.8;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // La fluidité est demandée ICI, explicitement — c'est pourquoi le CSS
      // n'a plus besoin (et ne doit plus avoir) de scroll-smooth.
      el.scrollBy({
        left: direction * step,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [pauseTemporarily],
  );

  // onPointerEnter/Leave filtré sur le type de pointeur : sur mobile, un tap
  // émet un `pointerenter` SANS `pointerleave` correspondant — le pointeur
  // tactile cesse d'exister au lieu de sortir. Le tactile passe donc
  // exclusivement par les pauses à échéance.
  const scrollerHandlers = {
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") pauseWhileHovering();
    },
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") resume();
    },
    onFocus: pauseWhileHovering,
    onBlur: resume,
    onTouchStart: pauseTemporarily,
    onTouchEnd: pauseTemporarily,
    onWheel: pauseTemporarily,
  };

  return { scrollerRef, handleScroll, scrollByCard, scrollerHandlers };
}
