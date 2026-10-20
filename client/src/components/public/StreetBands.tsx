"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "@/features/motion/useReducedMotion";
import { useI18n } from "@/i18n/I18nProvider";
import { TerrazzoChip } from "./TerrazzoChip";

// Le défilement accélère avec la vitesse de scroll, puis retombe à son
// rythme : BOOST_PER_SPEED convertit des px/ms en vitesse supplémentaire,
// BOOST_DECAY est la part de l'élan gardée d'une image à l'autre.
const BOOST_PER_SPEED = 4;
const MAX_BOOST = 6;
const BOOST_DECAY = 0.92;

function BandWords({ words, chipColor }: { words: string[]; chipColor: string }) {
  return words.map((word, index) => (
    <span
      key={word}
      className="flex shrink-0 items-center gap-4 pe-4 sm:gap-6 sm:pe-6"
    >
      {word}
      <span className="block h-5 w-5 sm:h-6 sm:w-6">
        <TerrazzoChip shape={index} color={chipColor} />
      </span>
    </span>
  ));
}

interface BandProps {
  words: string[];
  chipColor: string;
  reverse?: boolean;
  /** Position et inclinaison du bandeau. */
  className: string;
  /** Fond et couleur du texte, posés sur la piste. */
  colorClassName: string;
}

function Band({
  words,
  chipColor,
  reverse = false,
  className,
  colorClassName,
}: BandProps) {
  // La piste contient quatre fois la liste et glisse de -50 % en boucle :
  // à la fin du trajet, la seconde moitié occupe exactement la place de la
  // première, le saut est invisible. Deux fois la liste par moitié : une
  // seule ne couvrait pas un écran de 1920 px.
  //
  // Les couleurs (colorClassName) sont posées sur la piste elle-même et non
  // sur le bandeau : la piste déborde largement du bandeau, et l'audit de
  // contraste de Lighthouse lisait le fond de la page derrière les mots qui
  // dépassaient.
  return (
    <div
      className={`absolute inset-x-[-4%] font-heading text-2xl font-bold leading-none sm:text-4xl ${className}`}
    >
      <div
        className={`marquee-track flex w-max py-2.5 sm:py-3 ${colorClassName}`}
        data-direction={reverse ? "reverse" : undefined}
        style={{ "--marquee-duration": "48s" } as CSSProperties}
      >
        {[0, 1, 2, 3].map((copy) => (
          <div key={copy} className="flex shrink-0">
            <BandWords words={words} chipColor={chipColor} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Deux bandeaux croisés, comme du ruban adhésif collé en travers d'une
 * affiche. Purement décoratifs (aria-hidden) : tout ce qu'ils disent figure
 * ailleurs sur la page.
 *
 * Le défilement est une animation CSS, donc jouée par le compositeur sans
 * JavaScript. Le script ne fait que moduler sa vitesse (playbackRate, via
 * l'API Web Animations) quand la page défile, et il s'arrête dès que l'élan
 * est retombé.
 */
export function StreetBands() {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { dict } = useI18n();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion) return;

    // Les animations CSS des pistes, récupérées comme des objets Animation.
    // Liste vide avec les animations réduites : le CSS n'en déclare pas.
    const animations = Array.from(
      root.querySelectorAll<HTMLElement>(".marquee-track"),
    ).flatMap((track) => track.getAnimations());
    if (animations.length === 0) return;

    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let boost = 0;
    // Le sens suit le dernier défilement : vers le bas, les bandeaux
    // avancent, vers le haut, ils reculent.
    let direction = 1;
    let frameId = 0;

    const tick = () => {
      boost *= BOOST_DECAY;
      if (boost < 0.01) {
        boost = 0;
        frameId = 0;
      } else {
        frameId = requestAnimationFrame(tick);
      }
      const rate = direction * (1 + boost);
      for (const animation of animations) animation.playbackRate = rate;
    };

    const handleScroll = () => {
      const now = performance.now();
      const deltaY = window.scrollY - lastScrollY;
      const speed = Math.abs(deltaY) / Math.max(now - lastTime, 1);
      lastScrollY = window.scrollY;
      lastTime = now;

      if (deltaY !== 0) direction = deltaY > 0 ? 1 : -1;
      boost = Math.min(MAX_BOOST, Math.max(boost, speed * BOOST_PER_SPEED));
      if (frameId === 0) frameId = requestAnimationFrame(tick);
    };

    // N'écoute le scroll que lorsque les bandeaux sont à l'écran.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        lastScrollY = window.scrollY;
        lastTime = performance.now();
        window.addEventListener("scroll", handleScroll, { passive: true });
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== 0) cancelAnimationFrame(frameId);
    };
  }, [prefersReducedMotion]);

  return (
    // -mt : les bandeaux chevauchent le bas du panneau du hero, qui leur
    // réserve la place (padding bas). overflow-x-clip et non hidden : hidden
    // couperait aussi le haut et le bas des bandeaux inclinés.
    <div
      ref={rootRef}
      aria-hidden="true"
      className="relative z-10 -mt-10 h-36 overflow-x-clip sm:-mt-14 sm:h-44"
    >
      {/* Couleurs en dur et non jetons du thème : chaque paire a été
          vérifiée pour ce seul usage (4,85:1 en clair, 6,6:1 en sombre). */}
      <Band
        words={dict.bands.service}
        chipColor="var(--chip-sand)"
        reverse
        className="top-[36%] -translate-y-1/2 rotate-[4deg]"
        colorClassName="bg-[#965e4c] text-[#fbf5ef] dark:bg-[#8b2e3a] dark:text-[#ebe8b8]"
      />
      {/* Éclats couleur du fond de page : crème sur le bandeau brun en
          clair, presque noir sur le bandeau moutarde en sombre. */}
      <Band
        words={dict.bands.menu}
        chipColor="var(--background)"
        className="top-[58%] -translate-y-1/2 -rotate-[3deg] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)]"
        colorClassName="bg-band text-band-ink"
      />
    </div>
  );
}
