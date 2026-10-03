"use client";

import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import type { MenuItem } from "@/types/menuItem";

interface MenuItemCardProps {
  item: MenuItem;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function MenuItemCard({
  item,
  isAdmin,
  onEdit,
  onDelete,
}: MenuItemCardProps) {
  const categoryName =
    typeof item.category === "object" ? item.category.name : null;
  const hasVariants = item.variants.length > 1;
  // Math.min() sur un tableau vide renvoie Infinity : on préfère ne rien
  // afficher plutôt qu'un "dès ∞ DA" si un item arrive sans variante.
  const minPrice = item.variants.length
    ? Math.min(...item.variants.map((v) => v.price))
    : null;

  return (
    <article
      className={`surface-card group relative flex flex-col overflow-hidden transition-all pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:shadow-food-sm ${
        item.available ? "" : "opacity-60"
      }`}
    >
      {/* Photo laissée entièrement libre : sur une carte de ~165px en grille
          2 colonnes, le moindre bouton en surimpression masque le produit —
          or c'est la photo qui permet de le reconnaître d'un coup d'œil. */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-2">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:pointer-fine:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="icon-[mdi--food] text-4xl text-foreground/20" />
          </div>
        )}

        {categoryName && (
          <span className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            {categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
        {/* min-w-0 sur le titre : sans lui, truncate ne se déclenche pas dans
            un conteneur flex et le prix se fait pousser hors de la carte. */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate font-heading text-sm font-bold text-foreground">
            {item.name}
          </h3>
          {minPrice !== null && (
            <span className="shrink-0 whitespace-nowrap font-heading text-sm font-bold tabular-nums text-accent-green">
              {hasVariants ? "dès " : ""}
              {formatDA(minPrice)}
            </span>
          )}
        </div>

        {/* La description existait en base sans jamais être affichée ici —
            c'est pourtant elle qui distingue deux burgers au nom proche. */}
        {item.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-foreground/75">
            {item.description}
          </p>
        )}

        {hasVariants && (
          <p className="truncate text-xs font-semibold text-foreground/45">
            {item.variants
              .map((v) => formatVariantLabel(v.combination))
              .join(" · ")}
          </p>
        )}

        {/* Pied de carte : état à gauche, actions à droite. Toujours visibles,
            donc atteignables au doigt comme à la souris, et sans jamais
            recouvrir la photo. */}
        <div className="mt-auto flex items-center gap-2 border-t border-border-subtle pt-2.5">
          <span
            className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
              item.available
                ? "bg-accent-green/10 text-accent-green"
                : "bg-accent-bordeaux/10 text-accent-bordeaux"
            }`}
          >
            {item.available ? "Disponible" : "Épuisé"}
          </span>

          {isAdmin && (
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Modifier ${item.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/45 transition-colors hover:bg-surface-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="icon-[mdi--pencil-outline] text-base" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Supprimer ${item.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/45 transition-colors hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bordeaux"
              >
                <span className="icon-[mdi--trash-can-outline] text-base" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
