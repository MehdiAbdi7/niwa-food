"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useIsPageIdle } from "@/features/motion/useIsPageIdle";
import { useReducedMotion } from "@/features/motion/useReducedMotion";
import { TerrazzoChip } from "./TerrazzoChip";

const AUTOPLAY_INTERVAL_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

// Largeur réellement affichée du plat : 78 % de la scène, qui fait 22rem en
// mobile, 28rem dès sm et 31rem dès lg. Sans `sizes`, Next.js supposerait
// 100vw et servirait une image bien trop large.
const HERO_IMAGE_SIZES =
  "(min-width: 1024px) 24rem, (min-width: 640px) 22rem, 17rem";

export interface HeroSlide {
  src: string;
  alt: string;
  label: string;
}

interface FloatingChip {
  shape: number;
  color: string;
  /** Position et taille en % de la scène, qui est carrée. */
  top: number;
  left: number;
  size: number;
  /** Amplitude de la parallaxe, en px pour un curseur au bord de l'écran. */
  depth: number;
  /** Passe devant le plat : c'est ce qui donne la profondeur. */
  front?: boolean;
}

// Les éclats proches (depth élevé) bougent plus que les lointains, comme
// quand on bouge la tête devant une vitrine.
const FLOATING_CHIPS: FloatingChip[] = [
  {
    shape: 0,
    color: "var(--chip-terracotta)",
    top: 1,
    left: 9,
    size: 13,
    depth: 14,
  },
  {
    shape: 3,
    color: "var(--chip-blue)",
    top: 7,
    left: 77,
    size: 10,
    depth: 22,
  },
  {
    shape: 4,
    color: "var(--chip-bordeaux)",
    top: 36,
    left: -1,
    size: 9,
    depth: 30,
    front: true,
  },
  {
    shape: 1,
    color: "var(--chip-mustard)",
    top: 35,
    left: 92,
    size: 11,
    depth: 18,
  },
  {
    shape: 5,
    color: "var(--chip-olive)",
    top: 79,
    left: 5,
    size: 10,
    depth: 24,
  },
  {
    shape: 2,
    color: "var(--chip-terracotta)",
    top: 72,
    left: 85,
    size: 8,
    depth: 36,
    front: true,
  },
  {
    shape: 4,
    color: "var(--chip-blue)",
    top: 86,
    left: 60,
    size: 6,
    depth: 40,
    front: true,
  },
];

function chipStyle(chip: FloatingChip, index: number): CSSProperties {
  // Point de départ du jaillissement : le centre de la scène, exprimé dans
  // l'unité de translate(), le % de la taille de l'éclat lui-même.
  const burstX = ((50 - chip.left - chip.size / 2) / chip.size) * 100;
  const burstY = ((50 - chip.top - chip.size / 2) / chip.size) * 100;

  return {
    top: `${chip.top}%`,
    left: `${chip.left}%`,
    width: `${chip.size}%`,
    height: `${chip.size}%`,
    "--depth": chip.depth,
    "--bx": `${burstX.toFixed(1)}%`,
    "--by": `${burstY.toFixed(1)}%`,
    "--d": `${index * 0.05}s`,
    // Durées et décalages différents : des éclats synchrones se liraient
    // comme un seul objet qui respire.
    "--t": `${6 + (index % 3) * 1.4}s`,
    "--fd": `${-index * 0.9}s`,
    "--float": `${index % 2 ? -12 : 9}px`,
    "--spin": `${index % 2 ? 14 : -10}deg`,
  } as CSSProperties;
}

function FloatingChips({ front }: { front: boolean }) {
  return FLOATING_CHIPS.map((chip, index) =>
    Boolean(chip.front) !== front ? null : (
      <div
        key={index}
        aria-hidden="true"
        className={`hero-chip pointer-events-none absolute ${front ? "z-30" : "z-10"}`}
        style={chipStyle(chip, index)}
      >
        <div className="hero-chip-burst h-full w-full">
          <div className="hero-chip-float h-full w-full">
            <TerrazzoChip shape={chip.shape} color={chip.color} />
          </div>
        </div>
      </div>
    ),
  );
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

/**
 * Les plats du hero, qui tournent dans le cercle doré.
 *
 * Les plats sont disposés en cercle autour d'un axe placé sous la scène,
 * un tous les 360/n degrés. Changer de plat, c'est faire tourner tout le
 * cercle d'un cran : l'ancien plat part en arc d'un côté pendant que le
 * suivant arrive de l'autre.
 *
 * `turn` compte les crans depuis le début, sans jamais revenir à zéro. Avec
 * un simple index de 0 à n-1, passer du dernier plat au premier ferait
 * tourner le cercle d'un tour presque complet en arrière.
 */
export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [turn, setTurn] = useState(0);
  const stepDeg = 360 / slides.length;
  // Modulo positif : en JavaScript, -1 % 5 vaut -1, pas 4.
  const currentIndex = ((turn % slides.length) + slides.length) % slides.length;

  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Refs et non state : ces valeurs changent au moindre survol, un rendu à
  // chaque fois ne servirait à rien, seul l'autoplay les lit.
  const isPaused = useRef(false);
  const isVisible = useRef(true);

  // Les plats 2 à 5 ne sont rendus qu'après le chargement de la page.
  // Invisibles mais présents dans le DOM, ils étaient téléchargés tout de
  // suite : 155 Ko qui se partageaient le réseau avec la première photo,
  // l'élément LCP, et la retardaient sur mobile. Ils ne servent qu'au premier
  // changement de plat, six secondes plus tard. Exception : un clic sur une
  // flèche avant ce moment (hasNavigated) les rend sans attendre.
  const isPageIdle = useIsPageIdle();
  const [hasNavigated, setHasNavigated] = useState(false);
  const areOtherSlidesReady = isPageIdle || hasNavigated;

  // Hors écran, les plats ne tournent pas : un changement que personne ne
  // voit, c'est un plat qu'on découvre en retard en remontant.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(([entry]) => {
      isVisible.current = entry.isIntersecting;
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      if (isPaused.current || !isVisible.current) return;
      setTurn((value) => value + 1);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Parallaxe des éclats : la position du curseur sur l'écran, ramenée entre
  // -1 et 1, est publiée en --mx / --my sur la scène. Le CSS (.hero-chip)
  // en déduit le décalage de chaque éclat. Souris uniquement, et une seule
  // écriture par image même si la souris envoie dix événements.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;

    const apply = () => {
      frameId = 0;
      stage.style.setProperty("--mx", pointerX.toFixed(3));
      stage.style.setProperty("--my", pointerY.toFixed(3));
    };

    const handleMove = (event: PointerEvent) => {
      if (!isVisible.current) return;
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
      if (frameId === 0) frameId = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frameId !== 0) cancelAnimationFrame(frameId);
    };
  }, [prefersReducedMotion]);

  // Un clic avant la fin du chargement doit montrer un plat, pas une
  // cercle vide : tous les plats sont alors rendus sans attendre.
  const goToNext = () => {
    setHasNavigated(true);
    setTurn((value) => value + 1);
  };

  const goToPrev = () => {
    setHasNavigated(true);
    setTurn((value) => value - 1);
  };

  // Swipe tactile : on ne lit que l'axe horizontal, le défilement vertical
  // de la page n'est jamais bloqué.
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - event.changedTouches[0].clientX;

    if (deltaX > SWIPE_THRESHOLD_PX) goToNext();
    else if (deltaX < -SWIPE_THRESHOLD_PX) goToPrev();

    touchStartX.current = null;
  };

  return (
    <div
      role="group"
      aria-roledescription="carrousel"
      aria-label="Quelques plats de la carte"
      // Survol à la souris ou focus clavier dans le carrousel : on regarde,
      // les plats attendent.
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") isPaused.current = true;
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") isPaused.current = false;
      }}
      onFocus={() => {
        isPaused.current = true;
      }}
      onBlur={() => {
        isPaused.current = false;
      }}
      className="relative mx-auto flex w-full max-w-88 flex-col items-center sm:max-w-md lg:max-w-136"
    >
      <div
        ref={stageRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square w-full"
      >
        {/* Le cercle d'origine du hero : dégradé primary qui monte du bas et
            halo doré, aux couleurs de la marque dans les deux thèmes. Il ne
            tourne pas (un dégradé qui pivote se verrait), seuls les plats
            tournent. Parallaxe inverse, très faible. */}
        <div
          aria-hidden="true"
          className="hero-chip absolute inset-[9%]"
          style={{ "--depth": -6 } as CSSProperties}
        >
          <div className="h-full w-full rounded-full bg-linear-to-t from-primary/50 via-transparent to-transparent shadow-[0_0_30px_5px_rgba(217,169,77,0.45)] shadow-primary" />
        </div>

        {/* Ombre de contact sous le plat : elle s'étale à l'impact. */}
        <div
          aria-hidden="true"
          className="hero-shadow-land absolute left-[22%] right-[22%] top-[76%] h-[10%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(30_15_5/0.4),transparent)]"
        />

        <FloatingChips front={false} />

        {slides.map((slide, index) => {
          // Plats 2 à 5 absents du DOM tant que la page n'a pas fini de
          // charger (voir areOtherSlidesReady). Le plat courant est toujours
          // rendu, par sécurité.
          if (index !== 0 && index !== currentIndex && !areOtherSlidesReady) {
            return null;
          }
          const isCurrent = index === currentIndex;

          return (
            <div
              key={slide.src}
              aria-hidden={!isCurrent}
              className="hero-dish pointer-events-none absolute inset-0 z-20"
              style={{
                transform: `rotate(${(index - turn) * stepDeg}deg)`,
                opacity: isCurrent ? 1 : 0,
              }}
            >
              {/* La chute ne concerne que le premier plat, au chargement : la
                  classe est posée une fois et l'élément n'est jamais recréé,
                  l'animation ne rejoue donc pas aux tours suivants. */}
              <div
                className={`absolute inset-x-[11%] bottom-[16%] top-[6%] ${
                  index === 0 ? "hero-dish-drop" : ""
                }`}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes={HERO_IMAGE_SIZES}
                  // Le premier plat est l'élément LCP de l'accueil : préchargé
                  // et demandé en priorité haute. Sans fetchPriority, le
                  // navigateur le découvre tôt mais le télécharge en
                  // priorité basse, comme n'importe quelle image.
                  preload={index === 0}
                  fetchPriority={index === 0 ? "high" : undefined}
                  className="object-contain"
                />
              </div>
            </div>
          );
        })}

        <FloatingChips front />
      </div>

      {/* Commandes sous le cercle sur mobile : sur un écran de 360 px,
          posées sur la scène, elles masquaient le bord des plats.
          Dès md, les flèches passent de chaque côté du cercle, à mi-hauteur
          de la scène (hauteur totale moins la rangée de légende, 2,75rem) :
          sous le cercle, elles tombaient sous la ligne de flottaison d'un
          écran 1080p. La légende, elle, reste dessous. */}
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Plat précédent"
          className="z-40 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-primary bg-linear-to-t from-primary/50 via-transparent to-transparent text-foreground transition-transform hover:scale-110 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-foreground md:absolute md:left-0 md:top-[calc(50%-1.375rem)] md:-translate-y-1/2"
        >
          <span
            aria-hidden="true"
            className="icon-[mdi--chevron-left] text-2xl"
          />
        </button>
        {/* Légende posée dans le bas du cercle. */}
        <div className="pointer-events-none absolute inset-x-[15%] bottom-[14%] z-30 h-10">
          {slides.map((slide, index) => (
            <p
              key={slide.src}
              aria-hidden={index !== currentIndex}
              className={`absolute inset-0 m-auto flex h-fit w-fit max-w-full items-center justify-center rounded-full border border-primary bg-background/80 px-4 py-1.5 text-center font-heading text-sm font-bold leading-tight text-foreground backdrop-blur-sm transition-opacity duration-300 sm:text-base ${
                index === currentIndex ? "opacity-100 delay-200" : "opacity-0"
              }`}
            >
              {slide.label}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={goToNext}
          aria-label="Plat suivant"
          className="z-40 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-primary bg-linear-to-t from-primary/50 via-transparent to-transparent text-foreground transition-transform hover:scale-110 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-foreground md:absolute md:right-0 md:top-[calc(50%-1.375rem)] md:-translate-y-1/2"
        >
          <span
            aria-hidden="true"
            className="icon-[mdi--chevron-right] text-2xl"
          />
        </button>
      </div>
    </div>
  );
}
