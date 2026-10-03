/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import {
  indexOptionsById,
  resolveExtraGroups,
  resolveOptionPrice,
} from "@/lib/extraGroups";
import { getEligibleFormulas, resolveEffectiveSize } from "@/lib/formulaRules";
import { useMenuOptionsByCategory } from "@/features/menu/useMenuOptionsByCategory";
import type { MenuItem, MenuItemVariant } from "@/types/menuItem";
import type { NewCartLine } from "../useItemCart";

interface ProductConfigModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (line: NewCartLine) => void;
}

export function ProductConfigModal({
  item,
  onClose,
  onConfirm,
}: ProductConfigModalProps) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [formulaId, setFormulaId] = useState<string | null>(null);
  const [formulaChoices, setFormulaChoices] = useState<Record<string, string>>(
    {},
  );

  // Options de formule lues dans le menu réel (canettes disponibles) plutôt
  // qu'une liste en dur. Aucune requête de plus : RTK Query sert le cache
  // déjà rempli par MenuBrowser.
  const optionsByCategory = useMenuOptionsByCategory();

  // Remise à zéro à chaque ouverture : sans ça, la formule du produit
  // précédent resterait active sur le suivant.
  useEffect(() => {
    if (!item) return;
    setVariantIndex(0);
    setSelectedExtraIds([]);
    setExcluded([]);
    setQuantity(1);
    setFormulaId(null);
    setFormulaChoices({});
  }, [item]);

  const eligibleFormulas = useMemo(
    () => (item ? getEligibleFormulas(item) : []),
    [item],
  );

  const selectedFormula = useMemo(
    () => eligibleFormulas.find((f) => f.id === formulaId) ?? null,
    [eligibleFormulas, formulaId],
  );

  const isFixed = selectedFormula?.pricingMode === "fixed";

  const variant: MenuItemVariant | undefined = item?.variants[variantIndex];

  // Une formule "fixed" sert le produit en format unique : plus de variante.
  // useMemo indispensable ici — `?? {}` crée un objet neuf à chaque rendu,
  // dont la nouvelle référence relancerait le useMemo des extras en boucle.
  const variantSelected = useMemo(
    () => (isFixed ? {} : (variant?.combination ?? {})),
    [isFixed, variant],
  );

  // Chaîne primitive, donc stable d'un rendu à l'autre : c'est elle qui casse
  // le risque de boucle sur les dépendances ci-dessous.
  const effectiveSize = resolveEffectiveSize(selectedFormula, variantSelected);

  const extraGroups = useMemo(
    () => (item ? resolveExtraGroups(item, effectiveSize) : []),
    [item, effectiveSize],
  );

  const optionById = useMemo(
    () => indexOptionsById(extraGroups),
    [extraGroups],
  );

  // Une option devenue non sélectionnable après changement de variante ou de
  // formule doit être décochée, sinon elle partirait sans prix affiché.
  useEffect(() => {
    setSelectedExtraIds((prev) => {
      const next = prev.filter((id) => optionById.has(id));
      // On renvoie `prev` à l'identique quand rien n'a changé : .filter()
      // produit toujours un nouveau tableau, et une nouvelle référence
      // relancerait un rendu, donc cet effet, en boucle.
      return next.length === prev.length ? prev : next;
    });
  }, [optionById]);

  if (!item || !variant) return null;

  const selectedExtras = selectedExtraIds
    .map((id) => optionById.get(id))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .map((option) => ({
      extraId: option.extra._id,
      name: option.extra.name,
      price: resolveOptionPrice(option, effectiveSize),
    }));

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);

  const basePrice = isFixed
    ? selectedFormula!.price
    : variant.price + (selectedFormula?.price ?? 0);

  const unitPrice = basePrice + extrasTotal;

  // Le backend refuse une formule dont un choix manque : on bloque avant
  // l'envoi plutôt que de laisser l'employé se prendre un 400.
  const missingChoice = (selectedFormula?.choices ?? []).some(
    (choice) => !formulaChoices[choice.label],
  );

  // Catégorie vide ou entièrement en rupture : la formule est incommandable,
  // le backend renverrait "Aucune option disponible". Même verdict ici.
  const unavailableChoice = (selectedFormula?.choices ?? []).some(
    (choice) => (optionsByCategory[choice.fromCategoryName] ?? []).length === 0,
  );

  function selectFormula(id: string | null) {
    setFormulaId(id);
    setFormulaChoices({}); // les choix d'une formule n'ont pas de sens sur l'autre
  }

  function toggleExtra(groupIndex: number, extraId: string) {
    const group = extraGroups[groupIndex];
    if (!group) return;

    setSelectedExtraIds((prev) => {
      if (prev.includes(extraId)) {
        return prev.filter((id) => id !== extraId);
      }
      if (group.singleChoice) {
        const sameGroupIds = group.options.map((option) => option.extra._id);
        return [...prev.filter((id) => !sameGroupIds.includes(id)), extraId];
      }
      return [...prev, extraId];
    });
  }

  function toggleExcluded(ingredient: string) {
    setExcluded((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient],
    );
  }

  function handleConfirm() {
    onConfirm({
      menuItemId: item!._id,
      name: item!.name,
      variant: variant!,
      extras: selectedExtras,
      excludedIngredients: excluded,
      quantity,
      ...(selectedFormula
        ? {
            formula: {
              formulaId: selectedFormula.id,
              name: selectedFormula.name,
              price: selectedFormula.price,
              pricingMode: selectedFormula.pricingMode,
              includes: [
                ...selectedFormula.includedNames,
                ...selectedFormula.choices.map(
                  (choice) => formulaChoices[choice.label]!,
                ),
              ],
              choices: formulaChoices,
            },
          }
        : {}),
    });
    onClose();
  }

  return (
    <Modal
      isOpen={item !== null}
      onClose={onClose}
      title={item.name}
      size="sheet"
      hideHeader
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuer la quantité"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-surface hover:text-foreground"
            >
              <span className="icon-[mdi--minus] text-base" />
            </button>
            <span className="tabular-nums w-6 text-center font-bold text-foreground">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Augmenter la quantité"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-surface hover:text-foreground"
            >
              <span className="icon-[mdi--plus] text-base" />
            </button>
          </div>

          <Button
            icon="icon-[mdi--cart-plus]"
            onClick={handleConfirm}
            disabled={missingChoice || unavailableChoice}
          >
            Ajouter · {formatDA(unitPrice * quantity)}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="relative -mx-5 -mt-4 overflow-hidden bg-linear-to-b from-surface-2 to-background">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche produit"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 text-foreground/75 shadow-sm backdrop-blur-sm hover:text-foreground"
          >
            <span className="icon-[mdi--close] text-xl" />
          </button>
          {/* h-72 / sm:h-80 : mêmes hauteurs que la fiche publique
                (ProductSheet). Combinées à la largeur "sheet", le visuel
                occupe la même surface relative que côté client. */}
          <div className="relative h-72 w-full sm:h-80">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-radial-[at_50%_38%] from-primary/12 via-primary/4 to-transparent"
            />
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt=""
                className="relative h-full w-full object-contain motion-safe:animate-[dishIn_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="icon-[mdi--food] text-5xl text-primary/30" />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h2
            id="modal-title"
            className="font-heading text-2xl font-bold leading-tight text-foreground"
          >
            {item.name}
          </h2>
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed text-foreground/75">
            {item.description}
          </p>
        )}

        {/* Formules */}
        {eligibleFormulas.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
              Formule
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectFormula(null)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                  formulaId === null
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-subtle text-foreground/75 hover:text-foreground"
                }`}
              >
                Seul
                {/* Le prix nu, comme sur la fiche publique : sans lui, « Seul »
                    est la seule option de la rangée sans chiffre, et l'écart
                    avec une formule ne se lit plus d'un coup d'œil. */}
                <span className="tabular-nums ml-2 font-normal">
                  {formatDA(variant.price)}
                </span>
              </button>
              {eligibleFormulas.map((formula) => (
                <button
                  key={formula.id}
                  onClick={() => selectFormula(formula.id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                    formulaId === formula.id
                      ? "border-accent-mustard bg-accent-mustard/10 text-accent-mustard"
                      : "border-border-subtle text-foreground/75 hover:text-foreground"
                  }`}
                >
                  {formula.name}
                  <span className="tabular-nums ml-2 font-normal">
                    {formula.pricingMode === "fixed"
                      ? formatDA(formula.price)
                      : `+${formatDA(formula.price)}`}
                  </span>
                </button>
              ))}
            </div>

            {selectedFormula && selectedFormula.includedNames.length > 0 && (
              <p className="text-xs text-accent-green">
                Inclus : {selectedFormula.includedNames.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Choix imposés par la formule (boisson...) — les options viennent
            désormais du menu, pas d'une liste figée dans le code. */}
        {(selectedFormula?.choices ?? []).map((choice) => {
          const options = optionsByCategory[choice.fromCategoryName] ?? [];

          return (
            <div key={choice.label} className="flex flex-col gap-2">
              <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
                {choice.label}
                <span className="ml-2 text-xs font-normal text-accent-bordeaux">
                  obligatoire
                </span>
              </p>

              {options.length === 0 ? (
                <p className="text-xs text-accent-bordeaux">
                  Aucun produit disponible dans «&nbsp;{choice.fromCategoryName}
                  &nbsp;» — ajoute-en depuis le Menu, ou cette formule reste
                  incommandable.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setFormulaChoices((prev) => ({
                          ...prev,
                          [choice.label]: option,
                        }))
                      }
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        formulaChoices[choice.label] === option
                          ? "border-accent-green bg-accent-green/10 text-accent-green"
                          : "border-border-subtle text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Variantes — masquées quand la formule impose un format unique */}
        {!isFixed && item.variants.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
              Choix
            </p>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setVariantIndex(i)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${
                    variantIndex === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-subtle text-foreground/75 hover:text-foreground"
                  }`}
                >
                  {formatVariantLabel(v.combination)}
                  <span className="tabular-nums ml-2 font-normal">
                    {formatDA(v.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isFixed && item.variants.length > 1 && (
          <p className="text-xs text-foreground/75">
            Format unique en {selectedFormula!.name} — pas de taille à choisir.
          </p>
        )}

        {/* Extras, groupés selon la configuration du produit */}
        {extraGroups.map((group, groupIndex) => (
          <div key={group.label} className="flex flex-col gap-2">
            <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
              {group.label}
              {group.singleChoice && (
                <span className="ml-2 text-xs font-normal text-foreground/75">
                  un seul choix
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedExtraIds.includes(option.extra._id);
                const price = resolveOptionPrice(option, effectiveSize);
                return (
                  <button
                    key={option.extra._id}
                    onClick={() => toggleExtra(groupIndex, option.extra._id)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "border-accent-green bg-accent-green/10 text-accent-green"
                        : "border-border-subtle text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`${isSelected ? "icon-[mdi--check-circle]" : "icon-[mdi--plus-circle-outline]"} text-base`}
                    />
                    {option.extra.name}
                    {price > 0 && (
                      <span className="tabular-nums text-xs font-normal">
                        +{formatDA(price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Ingrédients à retirer */}
        {item.removableIngredients && item.removableIngredients.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
              Retirer
            </p>
            <div className="flex flex-wrap gap-2">
              {item.removableIngredients.map((ingredient) => {
                const isExcluded = excluded.includes(ingredient);
                return (
                  <button
                    key={ingredient}
                    onClick={() => toggleExcluded(ingredient)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      isExcluded
                        ? "border-accent-bordeaux bg-accent-bordeaux/10 text-accent-bordeaux line-through"
                        : "border-border-subtle text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`${isExcluded ? "icon-[mdi--close-circle]" : "icon-[mdi--minus-circle-outline]"} text-base`}
                    />
                    {ingredient}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
