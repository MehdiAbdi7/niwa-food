"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  nextHeroSlide,
  prevHeroSlide,
} from "@/features/heroCarousel/heroCarouselSlice";

const SHARED_IMAGE_CLASSNAME =
  "absolute left-1/2 top-35 sm:top-50 w-[85%] sm:w-[85%] -translate-x-1/2 object-contain shadow-food-md transition-[transform,opacity] duration-700 ease-out ";

const AUTOPLAY_INTERVAL_MS = 6000;
const SLIDE_START_OFFSET = "7rem";
const SWIPE_THRESHOLD_PX = 40;

// Largeur réellement affichée : 85 % du cercle (20rem en mobile, 30rem max
// au-delà). Sans `sizes`, Next.js sert une image de 828px pour ~272px affichés.
const HERO_IMAGE_SIZES = "(min-width: 640px) 26rem, 17rem";

export interface HeroSlide {
  src: string;
  alt: string;
  label: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const currentIndex = useAppSelector(
    (state) => state.heroCarousel.currentIndex,
  );
  const dispatch = useAppDispatch();
  const touchStartX = useRef<number | null>(null);

  // Les slides 2 à 5 ne sont rendues qu'après le chargement de la page.
  // Invisibles (opacité 0) mais présentes dans le DOM, elles étaient
  // téléchargées tout de suite : 155 Ko qui se partageaient le réseau avec la
  // première photo, l'élément LCP, et la retardaient sur mobile. Elles ne
  // servent qu'au premier changement de slide, six secondes plus tard.
  const [areOtherSlidesReady, setAreOtherSlidesReady] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Après l'événement load, quand le navigateur souffle : la page a fini
    // son travail utile. requestIdleCallback n'existe pas sur Safari, d'où le
    // repli sur un simple délai.
    const reveal = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(
          () => setAreOtherSlidesReady(true),
          { timeout: 2000 },
        );
      } else {
        timeoutId = setTimeout(() => setAreOtherSlidesReady(true), 500);
      }
    };

    if (document.readyState === "complete") reveal();
    else window.addEventListener("load", reveal, { once: true });

    return () => {
      window.removeEventListener("load", reveal);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      dispatch(nextHeroSlide(slides.length));
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [dispatch, slides.length]);

  // Un clic avant la fin du chargement doit montrer une photo, pas un cercle
  // vide : toutes les slides sont alors rendues sans attendre.
  const goToNextSlide = () => {
    setAreOtherSlidesReady(true);
    dispatch(nextHeroSlide(slides.length));
  };

  const goToPrevSlide = () => {
    setAreOtherSlidesReady(true);
    dispatch(prevHeroSlide(slides.length));
  };

  // Swipe tactile — on ne touche qu'à l'axe horizontal,
  // donc le scroll vertical de la page n'est jamais bloqué
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const deltaX = touchStartX.current - e.changedTouches[0].clientX;

    if (deltaX > SWIPE_THRESHOLD_PX) {
      goToNextSlide(); // swipe vers la gauche → photo suivante
    } else if (deltaX < -SWIPE_THRESHOLD_PX) {
      goToPrevSlide(); // swipe vers la droite → photo précédente
    }

    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative order-2 mx-auto aspect-square w-full max-w-80 max-h-80 bg-linear-to-t from-primary/50 via-transparent to-transparent rounded-full shadow-[0_0_30px_5px_rgba(217,169,77,0.45)] shadow-primary sm:mx-0 sm:max-w-120 sm:max-h-120 md:max-w-[min(44vw,30rem)] md:max-h-[min(44vw,30rem)]"
    >
      <div
        className="absolute bottom-[6%] left-1/2 h-[8%] w-[70%]  rounded-full "
        aria-hidden="true"
      />

      {slides.map((slide, index) =>
        // Slides 2 à 5 absentes du DOM tant que la page n'a pas fini de
        // charger (voir areOtherSlidesReady). La slide courante est toujours
        // rendue, par sécurité.
        index !== 0 &&
        index !== currentIndex &&
        !areOtherSlidesReady ? null : (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          width={400}
          height={400}
          sizes={HERO_IMAGE_SIZES}
          // La première slide est l'élément LCP de l'accueil : on la précharge
          // au lieu de la laisser en lazy. Les suivantes restent en lazy.
          // fetchPriority="high" en plus : preload la découvre tôt, mais sans
          // ce signal le navigateur la télécharge en priorité "Low", comme
          // n'importe quelle image.
          preload={index === 0}
          fetchPriority={index === 0 ? "high" : undefined}
          className={`${SHARED_IMAGE_CLASSNAME} ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform:
              index === currentIndex
                ? "translateY(-50%)"
                : `translateY(calc(-50% - ${SLIDE_START_OFFSET}))`,
          }}
        />
      ))}

      {/* Label texte par slide, en overlay */}
      {slides.map((slide, index) => (
        <span
          key={`label-${slide.src}`}
          className={`absolute bottom-[17%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/70 px-4 py-1.5 text-xs font-semibold text-primary border-0.5 border-primary backdrop-blur-sm transition-opacity duration-700 ease-in-out sm:text-sm ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.label}
        </span>
      ))}

      {/* Flèche "photo précédente" */}
      <button
        type="button"
        onClick={goToPrevSlide}
        aria-label="Photo précédente"
        className="absolute left-[2%] top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/70 text-primary shadow-food-sm backdrop-blur-sm transition-transform hover:scale-110 sm:h-10 sm:w-10"
      >
        <span className="icon-[mdi--chevron-left] text-2xl" />
      </button>

      {/* Flèche "photo suivante" */}
      <button
        type="button"
        onClick={goToNextSlide}
        aria-label="Photo suivante"
        className="absolute right-[2%] top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-background/70 text-primary shadow-food-sm backdrop-blur-sm transition-transform hover:scale-110 sm:h-10 sm:w-10"
      >
        <span className="icon-[mdi--chevron-right] text-2xl" />
      </button>

      {/* Dots indicateurs, non cliquables, juste un repère visuel */}
      <div className="absolute bottom-[5%] left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:gap-2">
        {slides.map((slide, index) => (
          <span
            key={slide.src}
            aria-hidden="true"
            className={` rounded-full transition-opacity duration-300 ${
              index === currentIndex
                ? "bg-accent-green opacity-100 h-2.5 w-2.5"
                : "bg-primary opacity-80 h-2 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
