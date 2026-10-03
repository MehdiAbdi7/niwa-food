"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useGetMenuItemsQuery } from "@/features/menu/menuApi";
import { useInfiniteCarousel } from "@/features/carousel/useInfiniteCarousel";
import { BestSellerCard } from "./BestSellerCard";

// L'ordre fait foi : c'est l'ordre d'affichage dans le carrousel.
// Les noms doivent correspondre EXACTEMENT au champ `name` en base — un produit
// renommé côté dashboard fait disparaître la carte en silence, d'où le contrôle
// de développement plus bas.
const BEST_SELLER_NAMES = [
  "POLINI",
  "MALOSSI",
  "GIVI",
  "VESPA",
  "Tacos Classique",
  "SAMOURAI",
  "Galets Box",
  "Frites Niwa",
  "Salade César",
];

export function BestSellers() {
  const { data: menuItems, isLoading, isError } = useGetMenuItemsQuery();

  // useMemo obligatoire : sans lui, `bestSellers` serait un tableau neuf à
  // chaque rendu, et l'effet de recentrage du hook se rejouerait — le
  // carrousel sauterait à sa position initiale pendant que le client scrolle.
  const bestSellers = useMemo(() => {
    const resolved = BEST_SELLER_NAMES.map((name) =>
      menuItems?.find((item) => item.name === name && item.available),
    ).filter((item): item is NonNullable<typeof item> => item !== undefined);

    // Le filtrage par nom échoue silencieusement : sans ce signal, un produit
    // renommé ou épuisé se traduit juste par une carte manquante que personne
    // ne remarque avant une capture d'écran client.
    if (process.env.NODE_ENV !== "production" && menuItems) {
      const missing = BEST_SELLER_NAMES.filter(
        (name) => !menuItems.some((item) => item.name === name),
      );
      if (missing.length > 0) {
        console.warn(
          `[BestSellers] Introuvables au menu : ${missing.join(", ")}`,
        );
      }
    }

    return resolved;
  }, [menuItems]);

  const { scrollerRef, handleScroll, scrollByCard, scrollerHandlers } =
    useInfiniteCarousel(bestSellers.length);

  return (
    <section
      id="menu"
      className="relative bg-background isolate overflow-hidden px-2 py-16 sm:px-8"
    >
      <div className="relative z-10 mx-auto max-w-6xl rounded-4xl border border-primary background px-1 sm:px-4 py-4 shadow-[0_0_30px_5px_rgba(217,169,77,0.45)] shadow-primary/30 backdrop-blur-md dark:bg-primary/30 ">
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:mb-10 lg:flex-row lg:items-center lg:justify-center lg:px-6">
          <div>
            <span className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-foreground/70">
              La sélection Niwa
            </span>
            <h2 className="mt-1 font-heading text-3xl font-bold text-accent-green sm:text-4xl">
              Les best-sellers
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-foreground lg:mx-0">
              Les recettes que nos clients choisissent encore et encore.
            </p>
          </div>
        </div>

        {isLoading && (
          <p className="text-center text-sm text-foreground/75">
            Chargement des best-sellers...
          </p>
        )}

        {isError && (
          <p className="text-center text-sm text-accent-bordeaux">
            Impossible de charger le menu pour le moment.
          </p>
        )}

        {!isLoading && !isError && bestSellers.length > 0 && (
          <div className="relative">
            {/* Flèches masquées sous sm : le swipe suffit au doigt, et deux
                pastilles de plus encombreraient une carte déjà dense.
                Jamais désactivées — en boucle, il n'y a plus de bord. */}
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Produits précédents"
              className="absolute -left-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-primary shadow-food-sm backdrop-blur-sm transition-transform hover:scale-110 sm:-left-4 sm:flex"
            >
              <span className="icon-[mdi--chevron-left] text-2xl" />
            </button>

            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Produits suivants"
              className="absolute -right-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-primary shadow-food-sm backdrop-blur-sm transition-transform hover:scale-110 sm:-right-4 sm:flex"
            >
              <span className="icon-[mdi--chevron-right] text-2xl" />
            </button>

            {/* NI scroll-snap NI scroll-smooth ici — voir l'avertissement en
                tête de useInfiniteCarousel : le setter scrollLeft respecte
                scroll-behavior, donc `scroll-smooth` en CSS fige totalement la
                dérive sur Safari iOS. La fluidité des flèches est demandée
                explicitement dans scrollByCard.

                py-6 -my-6 : overflow-x-auto force implicitement overflow-y à
                "auto", ce qui rognerait le -translate-y-1.5 et le glow de 30px
                des cartes au survol. On rend l'espace sans décaler la page. */}
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              {...scrollerHandlers}
              role="region"
              aria-label="Carrousel des best-sellers"
              className="scrollbar-hide -my-6 flex gap-4 overflow-x-auto overscroll-x-contain px-1 py-4"
            >
              {/* Trois copies : c'est ce qui donne la boucle. Les deux
                  latérales sont aria-hidden ET hors parcours clavier — un
                  lecteur d'écran ne doit entendre la liste qu'une seule fois,
                  et la tabulation ne doit pas traverser 24 liens. */}
              {[0, 1, 2].map((copy) =>
                bestSellers.map((item) => (
                  <div
                    key={`${copy}-${item._id}`}
                    aria-hidden={copy !== 1}
                    className="shrink-0 basis-[38%] sm:basis-[28%] lg:basis-[22%]"
                  >
                    <BestSellerCard item={item} isDuplicate={copy !== 1} />
                  </div>
                )),
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center border-t border-primary/20 pt-4">
          <Link
            href="/commande"
            className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 font-bold text-on-primary transition-all duration-300 ease-in-out hover:scale-105 hover:bg-accent-slate"
          >
            Explorer tout le menu
            <span className="icon-[line-md--arrow-right-circle-twotone] text-xl transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
