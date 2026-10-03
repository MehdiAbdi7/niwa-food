"use client";

import { useState } from "react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import type { MenuItemVariant } from "@/types/menuItem";

interface VariantEditorProps {
  variants: MenuItemVariant[];
  onChange: (variants: MenuItemVariant[]) => void;
}

interface VariantDraft {
  attribute: string;
  value: string;
}

// Défensif : certains anciens produits peuvent ne pas avoir
// de `combination` en base.
function readCombination(variant: MenuItemVariant): VariantDraft {
  const combination = variant.combination ?? {};

  return {
    attribute: Object.keys(combination)[0] ?? "",
    value: Object.values(combination)[0] ?? "",
  };
}

export function VariantEditor({ variants, onChange }: VariantEditorProps) {
  const [drafts, setDrafts] = useState<VariantDraft[]>(() =>
    variants.map(readCombination),
  );

  // Si le parent remplace complètement la liste de variantes,
  // on récupère les données correspondantes.
  const rows =
    drafts.length === variants.length ? drafts : variants.map(readCombination);

  function commit(nextDrafts: VariantDraft[], nextVariants: MenuItemVariant[]) {
    setDrafts(nextDrafts);
    onChange(nextVariants);
  }

  function updateDraft(index: number, patch: Partial<VariantDraft>) {
    const nextDrafts = rows.map((draft, i) =>
      i === index ? { ...draft, ...patch } : draft,
    );

    const nextVariants = variants.map((variant, i) => {
      if (i !== index) return variant;

      const { attribute, value } = nextDrafts[index]!;

      return {
        combination: attribute && value ? { [attribute]: value } : {},
        price: variant.price,
      };
    });

    commit(nextDrafts, nextVariants);
  }

  function updatePrice(index: number, price: number) {
    onChange(
      variants.map((variant, i) =>
        i === index ? { ...variant, price } : variant,
      ),
    );
  }

  function addVariant() {
    commit(
      [
        ...rows,
        {
          attribute: "",
          value: "",
        },
      ],
      [
        ...variants,
        {
          combination: {},
          price: 0,
        },
      ],
    );
  }

  function removeVariant(index: number) {
    commit(
      rows.filter((_, i) => i !== index),
      variants.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-2 overflow-x-hidden">
      <label className="text-sm font-semibold text-foreground">
        Variantes / prix
      </label>

      <p className="text-xs text-foreground/75">
        Attribut et valeur sont optionnels : laisse-les vides pour un produit à
        format unique (canette, salade...). Seul le prix est requis.
      </p>

      {rows.map((draft, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-1">
          {/* 
            Mobile :
            - Les champs passent automatiquement à la ligne.
            
            Desktop :
            - Tous les champs restent sur la même ligne.
          */}
          <div className="flex w-full min-w-0 flex-wrap items-end gap-2 md:flex-nowrap">
            <div className="min-w-0 flex-1 basis-full sm:basis-[calc(50%-0.25rem)] md:basis-auto">
              <Input
                placeholder="Attribut (ex: taille)"
                value={draft.attribute}
                onChange={(e) =>
                  updateDraft(index, {
                    attribute: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>

            <div className="min-w-0 flex-1 basis-full sm:basis-[calc(50%-0.25rem)] md:basis-auto">
              <Input
                placeholder="Valeur (ex: M)"
                value={draft.value}
                onChange={(e) =>
                  updateDraft(index, {
                    value: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>

            <div className="min-w-0 flex-1 basis-[calc(100%-3.5rem)] sm:basis-auto md:flex-none">
              <Input
                type="number"
                min={0}
                placeholder="Prix"
                value={variants[index]?.price || ""}
                onChange={(e) => updatePrice(index, Number(e.target.value))}
                className="w-full md:w-28"
              />
            </div>

            <button
              type="button"
              onClick={() => removeVariant(index)}
              aria-label="Retirer cette variante"
              disabled={variants.length <= 1}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground/40 transition-colors hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span className="icon-[mdi--trash-can-outline] text-lg" />
            </button>
          </div>

          {Boolean(draft.attribute) !== Boolean(draft.value) && (
            <p className="text-xs text-accent-mustard">
              Remplis l&apos;attribut ET la valeur, ou laisse les deux vides.
            </p>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon="icon-[mdi--plus]"
        onClick={addVariant}
      >
        Ajouter une variante
      </Button>
    </div>
  );
}
