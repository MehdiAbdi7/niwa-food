"use client";

import Image from "next/image";
import { formatDA } from "@/lib/format";
import { summarizeVariants } from "@/lib/variantLabel";
import { hasExtras } from "@/lib/extraGroups";
import { getEligibleFormulas } from "@/lib/formulaRules";
import type { MenuItem } from "@/types/menuItem";

interface DishCardProps {
  item: MenuItem;
  /** Quantité déjà au panier — 0 si absent. */
  inCart: number;
  onSelect: (item: MenuItem) => void;
}

// Largeur d'AFFICHAGE de la vignette, pas le poids du fichier : le navigateur
// choisit la variante du srcset avec cette seule information, avant même
// d'avoir appliqué le CSS.
const THUMB_SIZES = "(max-width: 640px) 112px, 128px";

// Halo de studio derrière le produit détouré. En style inline et non en classe
// Tailwind : `bg-radial-*` n'existe que depuis la 4.1, et une classe arbitraire
// contenant color-mix() se parse mal. Ici le rendu est garanti, et la teinte
// suit le thème puisqu'elle est dérivée de --color-primary.
const HALO_STYLE = {
  background:
    "radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 72%)",
} as const;

// Un produit sans variante, sans extra, sans retrait possible et sans formule
// éligible n'a rien à configurer : il part au panier en un seul geste.
// hasExtras() couvre les deux modèles — extraGroups, et availableExtras pour
// les produits pas encore migrés.
export function hasChoices(item: MenuItem): boolean {
  return (
    item.variants.length > 1 ||
    hasExtras(item) ||
    (item.removableIngredients?.length ?? 0) > 0 ||
    getEligibleFormulas(item).length > 0
  );
}

export function DishCard({ item, inCart, onSelect }: DishCardProps) {
  const configurable = hasChoices(item);
  const isInCart = inCart > 0;

  const minPrice = item.variants.length
    ? Math.min(...item.variants.map((variant) => variant.price))
    : null;

  // Les axes de choix, pas les combinaisons — voir summarizeVariants.
  const variantChoices = summarizeVariants(item.variants);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`${item.name}, ${
        configurable ? "choisir les options" : "ajouter au panier"
      }`}
      // items-center et non items-stretch : dans une grille, une carte est
      // étirée à la hauteur de sa voisine. En ancrant le texte en haut et le
      // prix en bas (l'ancienne mise en page), un produit sans description —
      // une canette — se retrouvait avec 80px de vide au milieu. Centré, il
      // paraît simplement compact.
      className={`group relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-md transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:hover:-translate-y-0.5 sm:gap-4 sm:p-4 ${
        isInCart
          ? "border-accent-green/60 bg-accent-green/5 dark:bg-accent-green/10"
          : "border-primary/25 bg-background/70 hover:border-primary/60 hover:bg-background/90 dark:bg-primary/10"
      } hover:shadow-[0_0_28px_-8px_var(--color-primary)]`}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <h3 className="font-heading text-base font-bold leading-snug text-foreground">
          {item.name}
        </h3>

        {/* Entière, jamais tronquée : c'est la liste d'ingrédients, donc la
            seule information qui permet de trancher entre deux burgers. */}
        {item.description && (
          <p className="text-sm leading-relaxed text-foreground/75">
            {item.description}
          </p>
        )}

        {/* Une pastille par décision à prendre (viande, taille), et non une
            énumération des six combinaisons possibles. */}
        {variantChoices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {variantChoices.map(({ attribute, values }) => (
              <span
                key={attribute}
                className="inline-flex items-baseline gap-1 rounded-md bg-foreground/5 px-2 py-1 text-xs text-foreground/70"
              >
                <span className="font-semibold capitalize text-foreground/70">
                  {attribute}
                </span>
                {values.join(" · ")}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {minPrice !== null && (
            // Pastille et non texte nu : sur une grille de 35 cartes, c'est le
            // repère qu'on cherche en premier, il doit se détacher sans avoir
            // à être relu.
            <span className="tabular-nums inline-flex items-baseline gap-1 whitespace-nowrap rounded-full bg-accent-green/10 px-2.5 py-1 font-heading text-sm font-bold text-accent-green-text ring-1 ring-inset ring-accent-green/25">
              {item.variants.length > 1 && (
                <span className="text-xs font-semibold">dès</span>
              )}
              {formatDA(minPrice)}
            </span>
          )}

          {/* Dit ce que fait l'icône de la pastille d'action, plutôt que de
              laisser le client la découvrir en tapant dessus. */}
          {configurable && (
            <span className="hidden items-center gap-1 text-xs font-semibold text-foreground/70 sm:inline-flex">
              <span aria-hidden="true" className="icon-[mdi--tune-variant] text-sm" />
              à composer
            </span>
          )}
        </div>
      </div>

      <div className="relative shrink-0 self-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-primary/5 sm:h-32 sm:w-32">
          {/* Halo puis ombre de contact, AVANT l'image dans le DOM : la photo
              porte z-10 et passe donc par-dessus les deux. Sans ça, le halo
              recouvrirait le produit. */}
          <div aria-hidden="true" className="absolute inset-0" style={HALO_STYLE} />

          {item.imageUrl ? (
            <>
              {/* L'ellipse floue pose l'objet sur une surface au lieu de le
                  laisser en apesanteur — c'est ce qui sépare une photo de
                  catalogue d'un PNG collé sur un fond. */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-3 mx-auto h-2.5 w-1/2 rounded-[50%] bg-black/25 blur-md"
              />
              {/* next/image plutôt qu'un <img> brut : Cloudinary est déclaré
                  dans remotePatterns, donc Next sert une vignette au bon
                  format. Sur une page qui charge 35 produits d'un coup, c'est
                  le principal gain sur le LCP.
                  object-contain et non cover : ces visuels sont détourés, un
                  recadrage rognerait le pain du haut. */}
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes={THUMB_SIZES}
                className="z-10 object-contain p-1 transition-transform duration-500 motion-safe:group-hover:scale-105"
              />
            </>
          ) : (
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="icon-[mdi--food] text-3xl text-primary/30" />
            </div>
          )}
        </div>

        {/* Pastille d'action, débordant sur la photo — 44px de côté, la taille
            tactile minimale, puisque tout le monde commande au téléphone. */}
        <span
          className={`absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-background text-xl shadow-md transition-colors ${
            isInCart
              ? "bg-accent-green text-on-primary"
              : "bg-primary text-on-primary group-hover:bg-accent-green"
          }`}
        >
          {isInCart ? (
            <span className="tabular-nums text-sm font-bold">{inCart}</span>
          ) : (
            <span
              aria-hidden="true"
              className={
                configurable ? "icon-[mdi--tune-variant]" : "icon-[mdi--plus]"
              }
            />
          )}
        </span>
      </div>
    </button>
  );
}
