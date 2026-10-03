"use client";

import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import { hasExtras } from "@/lib/extraGroups";
import type { MenuItem } from "@/types/menuItem";
import { getEligibleFormulas } from "@/lib/formulaRules";

interface ProductGridProps {
  items: MenuItem[];
  // Quantité déjà au panier, par produit — évite de recompter le ticket
  // des yeux pour savoir si un article a déjà été saisi.
  quantityByItem: Record<string, number>;
  onSelect: (item: MenuItem) => void;
}

// Un produit sans options n'a rien à configurer : la page l'ajoute directement
// au ticket. Une formule éligible compte comme une option — sans ça, un burger
// sans variante partirait au ticket sans jamais proposer le menu.
export function hasOptions(item: MenuItem): boolean {
  return (
    item.variants.length > 1 ||
    hasExtras(item) ||
    (item.removableIngredients?.length ?? 0) > 0 ||
    getEligibleFormulas(item).length > 0
  );
}

export function ProductGrid({
  items,
  quantityByItem,
  onSelect,
}: ProductGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <span className="icon-[mdi--magnify-close] text-4xl text-foreground/25" />
        <p className="font-heading text-base font-bold text-foreground">
          Aucun produit ici
        </p>
        <p className="text-sm text-foreground/75">
          Change de catégorie ou vide la recherche.
        </p>
      </div>
    );
  }

  return (
    // Pas de items-start : les cartes d'une rangée s'étirent à la hauteur de la
    // plus haute, et le flex-1 interne aligne toutes les barres de prix.
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {items.map((item) => {
        const inCart = quantityByItem[item._id] ?? 0;
        const configurable = hasOptions(item);
        const minPrice = Math.min(...item.variants.map((v) => v.price));

        return (
          <button
            key={item._id}
            onClick={() => onSelect(item)}
            // isolate : `relative` seul ne crée PAS de contexte d'empilement,
            // donc le z-10 du badge ci-dessous concourait au niveau du parent
            // et pouvait recouvrir la barre de filtres collante. isolate
            // enferme tout ce qui est à l'intérieur de la carte.
            className="surface-card group relative isolate flex flex-col overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-food-sm"
          >
            {inCart > 0 && (
              <span className="tabular-nums absolute left-3 top-3 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent-green px-2 text-sm font-bold text-on-primary shadow-md">
                {inCart}
              </span>
            )}

            <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-2">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="icon-[mdi--food] text-4xl text-foreground/20" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <p className="line-clamp-2 font-heading text-sm font-bold leading-tight text-foreground">
                {item.name}
              </p>

              {/* flex-1 sur ce bloc, pas sur le parent seul : c'est lui qui
                  encaisse la hauteur excédentaire d'une carte étirée par sa
                  voisine. Sans ça, le vide se creuserait au-dessus du prix. */}
              <div className="flex flex-1 flex-col gap-1.5">
                {/* Description entière : en prise de commande, une description
                    tronquée oblige à ouvrir la fiche pour trancher entre deux
                    produits proches. */}
                {item.description && (
                  <p className="text-xs leading-relaxed text-foreground/75">
                    {item.description}
                  </p>
                )}

                {/* Le libellé de variante n'a de sens que s'il y a un choix à faire */}
                {item.variants.length > 1 && (
                  <p className="truncate text-xs text-foreground/75">
                    {item.variants
                      .map((v) => formatVariantLabel(v.combination))
                      .join(" · ")}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 transition-colors group-hover:bg-primary group-hover:text-on-primary">
                <span className="tabular-nums font-heading text-sm font-bold">
                  {item.variants.length > 1 ? "dès " : ""}
                  {formatDA(minPrice)}
                </span>
                <span
                  className={`${configurable ? "icon-[mdi--tune-variant]" : "icon-[mdi--plus-circle]"} text-lg`}
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
