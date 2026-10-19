"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useGetMenuItemsQuery } from "@/features/menu/menuApi";
import { useInfiniteCarousel } from "@/features/carousel/useInfiniteCarousel";
import { BestSellerCard } from "./BestSellerCard";

// L'ordre fait foi : c'est l'ordre d'affichage dans le carrousel.
// Les noms doivent correspondre EXACTEMENT au champ `name` en base. Un produit
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
  // chaque rendu, et l'effet de recentrage du hook se rejouerait. Le
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
    <section id="menu" className="px-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start gap-5 sm:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.01em] text-foreground sm:text-6xl">
              Les plus commandés
            </h2>
            <p className="mt-3 max-w-md text-base text-foreground/75 sm:text-lg">
              Les recettes que nos clients reprennent encore et encore.
            </p>
          </div>

          <Link
            href="/commande"
            className="btn-press shrink-0 rounded-full bg-primary px-6 py-3 font-heading text-base font-bold text-on-primary [--edge:#5e3a2e] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent-green dark:[--edge:#6b4b05]"
          >
            Voir toute la carte
          </Link>
        </div>

        {isLoading && (
          <p className="text-sm text-foreground/75">
            Chargement des best-sellers...
          </p>
        )}

        {isError && (
          <p className="text-sm text-accent-bordeaux">
            Impossible de charger le menu pour le moment.
          </p>
        )}

        {!isLoading && !isError && bestSellers.length > 0 && (
          <div className="relative">
            {/* Flèches masquées sous sm : le swipe suffit au doigt, et deux
                pastilles de plus encombreraient une rangée déjà dense.
                Jamais désactivées : en boucle, il n'y a plus de bord. */}
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Produits précédents"
              className="absolute -left-5 top-[40%] z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_18px_-8px_rgb(0_0_0/0.6)] transition-transform hover:scale-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-green sm:flex"
            >
              <span aria-hidden="true" className="icon-[mdi--chevron-left] text-3xl" />
            </button>

            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Produits suivants"
              className="absolute -right-5 top-[40%] z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_18px_-8px_rgb(0_0_0/0.6)] transition-transform hover:scale-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-green sm:flex"
            >
              <span aria-hidden="true" className="icon-[mdi--chevron-right] text-3xl" />
            </button>

            {/* NI scroll-snap NI scroll-smooth ici : voir l'avertissement en
                tête de useInfiniteCarousel. Le setter scrollLeft respecte
                scroll-behavior, donc `scroll-smooth` en CSS fige totalement la
                dérive sur Safari iOS. La fluidité des flèches est demandée
                explicitement dans scrollByCard.

                py-10 -my-10 : overflow-x-auto force implicitement overflow-y
                à "auto", ce qui rognerait le plat qui sort de sa vignette au
                survol et l'inclinaison de la carte. On rend l'espace sans
                décaler la page. */}
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              {...scrollerHandlers}
              role="region"
              aria-label="Carrousel des best-sellers"
              // Bords en fondu : les cartes coupées par le cadre s'effacent au
              // lieu de s'arrêter net.
              className="scrollbar-hide -mx-4 -my-10 flex gap-4 overflow-x-auto overscroll-x-contain px-4 py-10 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] sm:mx-0 sm:gap-5 sm:px-1"
            >
              {/* Trois copies : c'est ce qui donne la boucle. Les deux
                  latérales sont aria-hidden ET hors parcours clavier : un
                  lecteur d'écran ne doit entendre la liste qu'une seule fois,
                  et la tabulation ne doit pas traverser 27 liens. */}
              {[0, 1, 2].map((copy) =>
                bestSellers.map((item, index) => (
                  <div
                    key={`${copy}-${item._id}`}
                    aria-hidden={copy !== 1}
                    className="shrink-0 basis-[62%] sm:basis-[36%] lg:basis-[23%]"
                  >
                    <BestSellerCard
                      item={item}
                      index={index}
                      isDuplicate={copy !== 1}
                    />
                  </div>
                )),
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
