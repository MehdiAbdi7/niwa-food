"use client";

import { useState, type CSSProperties } from "react";
import { DEMO_MODE } from "@/config/site";
import { useIsPageIdle } from "@/features/motion/useIsPageIdle";
import { useReducedMotion } from "@/features/motion/useReducedMotion";
import { useI18n } from "@/i18n/I18nProvider";
import { fill } from "@/i18n/text";
import type { Store } from "@/types/store";

interface Testimonial {
  name: string;
  store: Store;
  rating: number;
  text: string;
}

// Les auteurs seulement : le texte de chaque avis est traduit, dans le même
// ordre, sous dict.testimonials.texts.
const AUTHORS: Omit<Testimonial, "text">[] = [
  { name: "Sofiane B.", store: "cheraga", rating: 5 },
  { name: "Amina K.", store: "kouba", rating: 5 },
  { name: "Yacine M.", store: "cheraga", rating: 4 },
  { name: "Lina H.", store: "kouba", rating: 5 },
  { name: "Nabil A.", store: "cheraga", rating: 5 },
  { name: "Meriem D.", store: "kouba", rating: 4 },
];

function StarRating({ rating }: { rating: number }) {
  const { dict } = useI18n();

  return (
    // role="img" indispensable : aria-label n'est autorisé que sur un élément
    // dont le rôle accepte un nom accessible. Un <div> nu a le rôle implicite
    // "generic", qui ne le permet pas : le label serait ignoré, et la note
    // jamais annoncée. Le rôle "img" traite les cinq étoiles comme une image
    // unique, décrite par son label.
    <div
      role="img"
      aria-label={fill(dict.testimonials.rating, { rating })}
      className="flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`icon-[mdi--star] text-lg ${
            index < rating ? "text-accent-mustard" : "text-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const { dict } = useI18n();

  return (
    // Légèrement de travers, un coup à gauche, un coup à droite : des avis
    // épinglés au mur, pas une grille de tableau de bord.
    <figure
      className="flex w-[18.5rem] shrink-0 flex-col gap-3 rounded-[1.75rem] bg-surface p-6 shadow-[0_18px_30px_-24px_rgb(61_39_22/0.6)] ring-1 ring-border-subtle sm:w-[23rem]"
      style={{ rotate: index % 2 ? "1deg" : "-1.2deg" }}
    >
      <div className="flex items-center justify-between gap-3">
        <StarRating rating={testimonial.rating} />
        {/* Ces avis sont des exemples rédigés pour la démo : chaque carte le
            dit, car une carte isolée défile sans le titre de la section. */}
      </div>

      <blockquote className="text-base leading-relaxed text-foreground">
        {testimonial.text}
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-2 pt-1 text-sm">
        <span className="font-heading text-base font-bold text-foreground">
          {testimonial.name}
        </span>
        <span className="flex items-center gap-0.5 text-foreground/75">
          <span
            aria-hidden="true"
            className="icon-[mdi--map-marker] text-base"
          />
          {dict.stores[testimonial.store].name}
        </span>
      </figcaption>
    </figure>
  );
}

interface ReviewRowProps {
  items: Testimonial[];
  reverse?: boolean;
  /** Rangée décorative : masquée aux lecteurs d'écran et sans animations. */
  extra?: boolean;
  /** Rend la seconde moitié de la piste, celle qui fait boucler. */
  withCopy: boolean;
  duration: string;
}

function ReviewRow({
  items,
  reverse = false,
  extra = false,
  withCopy,
  duration,
}: ReviewRowProps) {
  // La piste contient la liste deux fois et glisse de -50 % en boucle. Le
  // pe-5 de chaque moitié tient lieu d'espace entre elles : un gap sur la
  // piste ajouterait un demi-espace au trajet, et la boucle sauterait. pe
  // (fin de ligne) et non pr : en arabe, la fin est à gauche.
  return (
    <div
      aria-hidden={extra || undefined}
      className={`marquee-row overflow-x-clip py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] ${
        extra ? "marquee-row-extra" : ""
      }`}
    >
      <div
        className="marquee-track flex w-max"
        data-direction={reverse ? "reverse" : undefined}
        style={{ "--marquee-duration": duration } as CSSProperties}
      >
        {/* marquee-half : ce sont ces moitiés qui passent en grille quand
            les animations sont réduites (globals.css). */}
        <div className="marquee-half flex shrink-0 gap-5 pe-5">
          {items.map((testimonial, index) => (
            <ReviewCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
        {withCopy && (
          <div
            aria-hidden="true"
            className="marquee-copy marquee-half flex shrink-0 gap-5 pe-5"
          >
            {items.map((testimonial, index) => (
              <ReviewCard
                key={testimonial.name}
                testimonial={testimonial}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Les avis, en deux rangées qui défilent en sens opposé.
 *
 * Le défilement est une animation CSS (marquee-scroll, globals.css). Il
 * s'arrête au survol, quand le focus entre dans la section, et sur le
 * bouton pause : un contenu qui bouge tout seul plus de cinq secondes doit
 * pouvoir être arrêté (WCAG 2.2.2). Avec les animations réduites, il n'y a
 * plus de défilement du tout : les six avis se rangent en grille.
 *
 * Seule la première liste est rendue au chargement : copies et seconde
 * rangée ajoutent dix-huit cartes, rendues une fois la page au repos, et
 * jamais avec les animations réduites, où elles ne serviraient à rien.
 */
export function Testimonials() {
  const [isPaused, setIsPaused] = useState(false);
  const isPageIdle = useIsPageIdle();
  const prefersReducedMotion = useReducedMotion();
  const isLooping = isPageIdle && !prefersReducedMotion;
  const { dict } = useI18n();

  const testimonials: Testimonial[] = AUTHORS.map((author, index) => ({
    ...author,
    text: dict.testimonials.texts[index],
  }));
  // Seconde rangée : mêmes avis dans un autre ordre, pour que deux avis
  // identiques ne passent jamais l'un au-dessus de l'autre.
  const secondRow = [...testimonials.slice(3), ...testimonials.slice(0, 3)];

  return (
    <section id="avis">
      {/* En-tête dans la colonne commune aux autres sections. */}
      <div className="px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.01em] text-foreground sm:text-6xl">
              {dict.testimonials.title}
            </h2>
            {/* Le jour où le restaurant valide le site, ces exemples sont
                remplacés par de vrais avis (Google, par exemple) et la
                mention disparaît avec le mode démo. */}
            {DEMO_MODE ? (
              <p className="mt-4 inline-flex rounded-full border-2 border-dashed border-foreground/40 px-4 py-1.5 text-sm font-semibold text-foreground/85">
                {dict.testimonials.demoNotice}
              </p>
            ) : (
              <p className="mt-3 max-w-md text-base text-foreground/75 sm:text-lg">
                {dict.testimonials.lead}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((value) => !value)}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-foreground px-4 font-heading text-sm font-bold text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-green motion-reduce:hidden"
          >
            <span
              aria-hidden="true"
              className={`text-lg ${isPaused ? "icon-[mdi--play]" : "icon-[mdi--pause]"}`}
            />
            {isPaused ? dict.testimonials.resume : dict.testimonials.pause}
          </button>
        </div>
      </div>

      {/* data-ready : tant que la copie n'est pas rendue, la piste reste
          immobile (globals.css). À -50 %, une piste d'une seule moitié
          sauterait au bout de son trajet. */}
      {/* Même largeur que les best-sellers (max-w-6xl) : d'un bord à
          l'autre de l'écran, trop d'avis défilaient en même temps. */}
      <div className="px-4 sm:px-8">
        <div
          className="marquee mx-auto mt-8 flex max-w-6xl flex-col sm:mt-10"
          data-paused={isPaused}
          data-ready={isLooping}
        >
          <ReviewRow items={testimonials} withCopy={isLooping} duration="70s" />
          {isLooping && (
            <ReviewRow
              items={secondRow}
              reverse
              extra
              withCopy
              duration="80s"
            />
          )}
        </div>
      </div>
    </section>
  );
}
