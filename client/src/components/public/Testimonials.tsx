// src/components/public/Testimonials.tsx

"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  nextTestimonial,
  prevTestimonial,
} from "@/features/testimonials/testimonialsSlice";
import { DEMO_MODE } from "@/config/site";

const AUTOPLAY_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;

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

function StarRating({ rating }: { rating: number }) {
  return (
    // role="img" indispensable : aria-label n'est autorisé que sur un élément
    // dont le rôle accepte un nom accessible. Un <div> nu a le rôle implicite
    // "generic", qui ne le permet pas — le label était donc purement ignoré,
    // et la note jamais annoncée. Le rôle "img" traite les cinq étoiles comme
    // une image unique, décrite par son label.
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

export function Testimonials() {
  const currentIndex = useAppSelector(
    (state) => state.testimonials.currentIndex,
  );
  const dispatch = useAppDispatch();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      dispatch(nextTestimonial(TESTIMONIALS.length));
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [dispatch]);

  const goToNext = () => dispatch(nextTestimonial(TESTIMONIALS.length));
  const goToPrev = () => dispatch(prevTestimonial(TESTIMONIALS.length));

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;

    if (deltaX > SWIPE_THRESHOLD_PX) goToNext();
    else if (deltaX < -SWIPE_THRESHOLD_PX) goToPrev();

    touchStartX.current = null;
  };

  return (
    <section
      id="avis"
      className="relative isolate overflow-hidden px-2 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-4xl rounded-4xl background dark:bg-primary/30 px-4 py-8 shadow-[0_0_25px_5px_rgba(217,169,77,0.45)] shadow-primary/30 backdrop-blur-md sm:px-8 sm:py-12 border border-primary">
        <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
          <span className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-foreground/70">
            La parole aux habitués
          </span>
          <h2 className="font-heading text-3xl font-bold text-accent-green sm:text-4xl">
            Ce que disent nos clients
          </h2>
          {/* Ces avis sont des exemples rédigés pour la démo : les présenter
              comme de vrais clients serait trompeur. Le jour où le restaurant
              valide le site, ils sont remplacés par de vrais avis (Google, par
              exemple) et la mention disparaît avec le mode démo. */}
          {DEMO_MODE ? (
            <p className="max-w-md rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-foreground/80">
              Avis d&apos;exemple pour la démonstration, pas de vrais clients
            </p>
          ) : (
            <p className="max-w-md text-sm text-foreground/80">
              Des expériences partagées après un passage chez Niwa Food.
            </p>
          )}
        </div>

        {/* aria-live="polite" : le contenu change tout seul toutes les cinq
            secondes. Sans ça, un lecteur d'écran annonce le premier avis puis
            plus jamais rien, alors que le texte sous le curseur a changé. */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-live="polite"
          aria-atomic="true"
          className="relative mx-auto min-h-64 w-full max-w-2xl sm:min-h-56"
        >
          {TESTIMONIALS.map((testimonial, index) => {
            const isCurrent = index === currentIndex;

            return (
              <div
                key={testimonial.name}
                className={`absolute inset-0 flex flex-col items-center gap-4 rounded-3xl border border-primary bg-background p-6 text-center shadow-food-sm transition-[transform,opacity] duration-700 ease-out sm:p-8 ${
                  isCurrent ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: isCurrent ? "translateY(0)" : "translateY(1.5rem)",
                }}
                aria-hidden={!isCurrent}
                // Les avis masqués restent dans le DOM, superposés en absolu :
                // sans inert, leur texte reste sélectionnable à la souris et
                // interceptable au clavier alors qu'il est invisible.
                inert={!isCurrent}
              >
                <span
                  aria-hidden="true"
                  className="icon-[mdi--format-quote-open] text-3xl text-accent-green/60"
                />

                <p className="text-sm font-medium leading-relaxed text-foreground sm:text-base">
                  {testimonial.text}
                </p>

                <StarRating rating={testimonial.rating} />

                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-heading text-sm font-bold text-foreground">
                    {testimonial.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-accent-green">
                    <span
                      aria-hidden="true"
                      className="icon-[mdi--map-marker] text-sm"
                    />
                    {testimonial.location}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flèches */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Avis précédent"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary shadow-food-sm transition-transform hover:scale-110"
          >
            <span
              aria-hidden="true"
              className="icon-[mdi--chevron-left] text-2xl"
            />
          </button>

          {/* Dots — purement indicatifs, non cliquables, donc masqués en bloc
              plutôt que un par un. */}
          <div
            aria-hidden="true"
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {TESTIMONIALS.map((testimonial, index) => (
              <span
                key={testimonial.name}
                className={`rounded-full transition-opacity duration-300 ${
                  index === currentIndex
                    ? "bg-accent-green opacity-100 h-2.5 w-2.5"
                    : "bg-primary opacity-80 h-2 w-2"
                }`}
              />
            ))}
          </div>

          <span className="sr-only">
            Avis {currentIndex + 1} sur {TESTIMONIALS.length}
          </span>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Avis suivant"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary shadow-food-sm transition-transform hover:scale-110"
          >
            <span
              aria-hidden="true"
              className="icon-[mdi--chevron-right] text-2xl"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
