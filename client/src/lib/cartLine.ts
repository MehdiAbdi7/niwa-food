// src/lib/cartLine.ts

import { formatVariantLabel } from "@/lib/variantLabel";
import type { CreateOrderItemPayload } from "@/types/order";
import type { MenuItemVariant } from "@/types/menuItem";
import type { FormulaPricingMode } from "@/config/formulas";

export interface CartExtra {
  extraId: string;
  name: string;
  price: number; // résolu à la sélection, pour l'affichage uniquement
}

export interface CartFormula {
  formulaId: string;
  name: string;
  price: number;
  pricingMode: FormulaPricingMode;
  includes: string[]; // affichage ticket (inclus + choix résolus)
  choices: Record<string, string>; // renvoyé au backend pour revalidation
}

export interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  imageUrl?: string;
  variant: MenuItemVariant;
  extras: CartExtra[];
  excludedIngredients: string[];
  quantity: number;
  formula?: CartFormula;
}

export type NewCartLine = Omit<CartLine, "key">;

// Tout ici est du JSON pur : aucune classe, aucune fonction, aucune Date.
// C'est la condition pour que ces lignes vivent dans Redux sans déclencher
// l'avertissement de sérialisabilité — et demain pour les persister.

function isFixedFormula(line: Pick<CartLine, "formula">): boolean {
  return line.formula?.pricingMode === "fixed";
}

/**
 * Deux lignes ne fusionnent que si TOUT est identique : même produit, même
 * variante, mêmes extras, mêmes retraits, même formule. Sinon "1x burger seul"
 * et "1x burger en menu" deviendraient une ligne à 2, et la cuisine recevrait
 * une commande fausse.
 */
export function buildCartLineKey(line: NewCartLine): string {
  const extras = line.extras
    .map((extra) => extra.extraId)
    .sort()
    .join(",");

  const excluded = [...line.excludedIngredients].sort().join(",");

  const formula = line.formula
    ? `${line.formula.formulaId}:${JSON.stringify(line.formula.choices)}`
    : "";

  return `${line.menuItemId}|${JSON.stringify(
    line.variant.combination ?? {},
  )}|${extras}|${excluded}|${formula}`;
}

/** Prix d'une unité, formule et extras compris. */
export function getLineUnitPrice(
  line: Pick<CartLine, "variant" | "extras" | "formula">,
): number {
  const extrasTotal = line.extras.reduce((sum, extra) => sum + extra.price, 0);

  if (line.formula?.pricingMode === "fixed") {
    return line.formula.price + extrasTotal;
  }

  const supplement = line.formula?.price ?? 0;
  return line.variant.price + supplement + extrasTotal;
}

export function getLineTotal(line: CartLine): number {
  return getLineUnitPrice(line) * line.quantity;
}

export function countCartItems(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function sumCartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + getLineTotal(line), 0);
}

export function toOrderItemsPayload(
  lines: CartLine[],
): CreateOrderItemPayload[] {
  return lines.map((line) => ({
    menuItemId: line.menuItemId,

    // Une formule "fixed" sert le produit en format unique : la variante n'a
    // plus de sens et serait rejetée par le backend.
    variantSelected: isFixedFormula(line)
      ? {}
      : (line.variant.combination ?? {}),

    // Le backend ne veut que les IDs : il résout nom et prix lui-même.
    selectedExtras: line.extras.map((extra) => ({ extraId: extra.extraId })),

    excludedIngredients: line.excludedIngredients,
    quantity: line.quantity,

    ...(line.formula
      ? {
          formula: {
            formulaId: line.formula.formulaId,
            choices: line.formula.choices,
          },
        }
      : {}),
  }));
}

export type LineDetailTone = "neutral" | "formula" | "extra" | "removed";

export interface LineDetail {
  label: string;
  tone: LineDetailTone;
}

/**
 * Traduit une ligne en phrases lisibles pour le ticket.
 *
 * Centralisé ici plutôt que reconstruit dans chaque composant : le ticket
 * client, le ticket imprimé et la fiche commande doivent raconter exactement
 * la même chose, sinon le client et la cuisine ne lisent pas la même commande.
 */
export function describeLineOptions(line: CartLine): LineDetail[] {
  const details: LineDetail[] = [];
  const variantLabel = formatVariantLabel(line.variant.combination);

  if (!isFixedFormula(line) && variantLabel !== "Standard") {
    details.push({ label: variantLabel, tone: "neutral" });
  }

  if (line.formula) {
    details.push({
      label: line.formula.includes.length
        ? `${line.formula.name} : ${line.formula.includes.join(", ")}`
        : line.formula.name,
      tone: "formula",
    });
  }

  if (line.extras.length > 0) {
    details.push({
      label: `+ ${line.extras.map((extra) => extra.name).join(", ")}`,
      tone: "extra",
    });
  }

  if (line.excludedIngredients.length > 0) {
    details.push({
      label: `sans ${line.excludedIngredients.join(", ")}`,
      tone: "removed",
    });
  }

  return details;
}
