"use client";

import { useMemo, useState } from "react";
import { useGetMenuItemsQuery } from "@/features/menu/menuApi";
import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import { Input } from "@/components/ui/Input";
import { getLineUnitPrice, type CartLine, type NewCartLine } from "./useItemCart";
import type { MenuItemVariant } from "@/types/menuItem";

interface ItemPickerListProps {
  cart: CartLine[];
  onAdd: (line: NewCartLine) => void;
  onRemove: (key: string) => void;
}

// Sélecteur compact, utilisé pour AJOUTER des articles à une commande déjà
// créée (oubli, ajout en cours de repas). Volontairement sans extras ni
// retraits : pour une commande complète avec options, la page dédiée
// /commandes/nouvelle offre la modale de configuration.
export function ItemPickerList({ cart, onAdd, onRemove }: ItemPickerListProps) {
  const { data: menuItems, isLoading } = useGetMenuItemsQuery();
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const available = (menuItems ?? []).filter((item) => item.available);
    if (!search.trim()) return available;
    const query = search.toLowerCase();
    return available.filter((item) => item.name.toLowerCase().includes(query));
  }, [menuItems, search]);

  function handleAdd(menuItemId: string, name: string, variant: MenuItemVariant) {
    onAdd({
      menuItemId,
      name,
      variant,
      extras: [],
      excludedIngredients: [],
      quantity: 1,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Rechercher un produit..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && <p className="text-sm text-foreground/75">Chargement du menu...</p>}

      <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
        {filteredItems.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border-subtle px-3 py-2"
          >
            <span className="truncate text-sm font-semibold text-foreground">{item.name}</span>
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {item.variants.map((variant, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAdd(item._id, item.name, variant)}
                  className="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-xs font-bold text-foreground/80 hover:bg-primary/15 hover:text-primary"
                >
                  <span className="icon-[mdi--plus] text-sm" />
                  {formatVariantLabel(variant.combination)} · {formatDA(variant.price)}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!isLoading && filteredItems.length === 0 && (
          <p className="py-4 text-center text-sm text-foreground/40">Aucun produit trouvé</p>
        )}
      </div>

      {cart.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground/75">À ajouter</p>
          {cart.map((line) => {
            const variantLabel = formatVariantLabel(line.variant.combination);
            return (
              <div key={line.key} className="flex items-center justify-between text-sm">
                <span className="tabular-nums text-foreground/80">
                  {line.quantity}x {line.name}
                  {variantLabel !== "Standard" ? ` (${variantLabel})` : ""} ·{" "}
                  {formatDA(getLineUnitPrice(line))}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(line.key)}
                  aria-label="Retirer"
                  className="text-foreground/40 hover:text-accent-bordeaux"
                >
                  <span className="icon-[mdi--close] text-base" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
