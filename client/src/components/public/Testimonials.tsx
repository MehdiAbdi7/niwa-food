"use client";

import { useState, type CSSProperties } from "react";
import { DEMO_MODE } from "@/config/site";
import { useIsPageIdle } from "@/features/motion/useIsPageIdle";
import { useReducedMotion } from "@/features/motion/useReducedMotion";

interface Testimonial {
  name: string;
  location: "Kouba" | "Chéraga";
  rating: number;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sofiane B.",
    location: "Chéraga",
    rating: 5,
    text: "Le burger PIRELLI est devenu mon rituel du vendredi soir. Pain toasté, viande juteuse, rien à dire. La livraison a mis 25 minutes montre en main.",
  },
  {
    name: "Amina K.",
    location: "Kouba",
    rating: 5,
    text: "On a commandé pour toute la famille un dimanche, tacos et pizza. Tout est arrivé chaud et bien emballé. Les enfants ont adoré les frites Niwa.",
  },
  {
    name: "Yacine M.",
    location: "Chéraga",
    rating: 4,
    text: "Très bon rapport qualité-prix. J'ai mangé sur place, service rapide même en heure de pointe. Petit bémol sur l'attente un vendredi soir, sinon rien à redire.",
  },
  {
    name: "Lina H.",
    location: "Kouba",
    rating: 5,
    text: "La salade César est vraiment fraîche, pas comme certains fast-foods qui la préparent la veille. On sent que c'est fait minute.",
  },
  {
    name: "Nabil A.",
    location: "Chéraga",
    rating: 5,
    text: "Client depuis l'ouverture. La sauce maison sur le tacos GILERA est unique, je ne l'ai trouvée nulle part ailleurs à Alger.",
  },
  {
    name: "Meriem D.",
    location: "Kouba",
    rating: 4,
    text: "Bonne pizza, pâte bien fine et croustillante. On a commandé à emporter, prêt en 15 minutes comme annoncé. Je recommande.",
  },
];

// Seconde rangée : mêmes avis dans un autre ordre, pour que deux avis
// identiques ne passent jamais l'un au-dessus de l'autre.
const SECOND_ROW = [...TESTIMONIALS.slice(3), ...TESTIMONIALS.slice(0, 3)];

function StarRating({ rating }: { rating: number }) {
  return (
    // role="img" indispensable : aria-label n'est autorisé que sur un élément
    // dont le rôle accepte un nom accessible. Un <div> nu a le rôle implicite
    // "generic", qui ne le permet pas : le label serait ignoré, et la note
    // jamais annoncée. Le rôle "img" traite les cinq étoiles comme une image
    // unique, décrite par son label.
    <div
      role="img"
      aria-label={`${rating} sur 5 étoiles`}
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
          {testimonial.location}
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
  // pr-5 de chaque moitié tient lieu d'espace entre elles : un gap sur la
  // piste ajouterait un demi-espace au trajet, et la boucle sauterait.
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
        <div className="marquee-half flex shrink-0 gap-5 pr-5">
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
            className="marquee-copy marquee-half flex shrink-0 gap-5 pr-5"
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

  return (
    <section id="avis">
      {/* En-tête dans la colonne commune aux autres sections. */}
      <div className="px-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.01em] text-foreground sm:text-6xl">
              Ce qu&apos;en disent les habitués
            </h2>
            {/* Le jour où le restaurant valide le site, ces exemples sont
                remplacés par de vrais avis (Google, par exemple) et la
                mention disparaît avec le mode démo. */}
            {DEMO_MODE ? (
              <p className="mt-4 inline-flex rounded-full border-2 border-dashed border-foreground/40 px-4 py-1.5 text-sm font-semibold text-foreground/85">
                Avis d&apos;exemple pour la démonstration, pas de vrais clients
              </p>
            ) : (
              <p className="mt-3 max-w-md text-base text-foreground/75 sm:text-lg">
                Des expériences partagées après un passage chez Niwa Food.
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
            {isPaused ? "Relancer les avis" : "Mettre les avis en pause"}
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
          <ReviewRow items={TESTIMONIALS} withCopy={isLooping} duration="70s" />
          {isLooping && (
            <ReviewRow
              items={SECOND_ROW}
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
