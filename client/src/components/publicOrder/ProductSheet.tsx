"use client";

import { useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { useCart } from "@/features/publicOrder/useCart";
import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import {
  indexOptionsById,
  resolveExtraGroups,
  resolveOptionPrice,
} from "@/lib/extraGroups";
import { getEligibleFormulas, resolveEffectiveSize } from "@/lib/formulaRules";
import type { CartLine, NewCartLine } from "@/lib/cartLine";
import type { MenuItem } from "@/types/menuItem";

// Distance parcourue avant que la barre de titre ne devienne opaque.
// Volontairement inférieure à la hauteur de la photo : la bascule doit se
// faire pendant que celle-ci sort du champ, pas une fois qu'elle est partie.
const TITLE_BAR_OFFSET_PX = 110;

interface ProductSheetProps {
  item: MenuItem;
  optionsByCategory: Record<string, string[]>;
  /** Non nul = modification d'une ligne déjà au panier. */
  initialLine: CartLine | null;
  onClose: () => void;
}

type Tone = "primary" | "green" | "mustard";

const TONE_SELECTED: Record<Tone, string> = {
  primary: "border-primary bg-primary/10 text-primary",
  green: "border-accent-green bg-accent-green/10 text-accent-green",
  mustard: "border-accent-mustard bg-accent-mustard/10 text-accent-mustard",
};

function Field({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: { label: string; required?: boolean };
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
          {title}
        </h3>
        {hint && (
          <span
            className={`text-xs font-semibold ${
              hint.required ? "text-accent-bordeaux" : "text-foreground/40"
            }`}
          >
            {hint.label}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

// Cible tactile de 44px minimum : tout le monde commande au téléphone, souvent
// debout, souvent d'une main.
function Choice({
  isSelected,
  tone = "primary",
  onClick,
  children,
}: {
  isSelected: boolean;
  tone?: Tone;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
        isSelected
          ? TONE_SELECTED[tone]
          : "border-border-subtle text-foreground/70 hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function findVariantIndex(item: MenuItem, line: CartLine | null): number {
  if (!line) return 0;
  const target = JSON.stringify(line.variant.combination ?? {});
  const index = item.variants.findIndex(
    (variant) => JSON.stringify(variant.combination ?? {}) === target,
  );
  return index === -1 ? 0 : index;
}

export function ProductSheet({
  item,
  optionsByCategory,
  initialLine,
  onClose,
}: ProductSheetProps) {
  const { addLine, replaceLine, removeLine } = useCart();
  const isEditing = initialLine !== null;

  // Initialiseurs paresseux, pas d'effet de reset : le composant est remonté
  // par sa key à chaque produit (voir DishList).
  const [variantIndex, setVariantIndex] = useState(() =>
    findVariantIndex(item, initialLine),
  );
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(
    () => initialLine?.extras.map((extra) => extra.extraId) ?? [],
  );
  const [excluded, setExcluded] = useState<string[]>(
    () => initialLine?.excludedIngredients ?? [],
  );
  const [quantity, setQuantity] = useState(() => initialLine?.quantity ?? 1);
  const [formulaId, setFormulaId] = useState<string | null>(
    () => initialLine?.formula?.formulaId ?? null,
  );
  const [formulaChoices, setFormulaChoices] = useState<Record<string, string>>(
    () => initialLine?.formula?.choices ?? {},
  );

  // Pilote la bascule de la barre de titre. Un booléen et non le scrollTop
  // brut : stocker la position déclencherait un rendu à chaque pixel parcouru.
  const [isScrolled, setIsScrolled] = useState(false);

  const eligibleFormulas = useMemo(() => getEligibleFormulas(item), [item]);

  const selectedFormula = useMemo(
    () => eligibleFormulas.find((formula) => formula.id === formulaId) ?? null,
    [eligibleFormulas, formulaId],
  );

  const isFixed = selectedFormula?.pricingMode === "fixed";
  const variant = item.variants[variantIndex];

  // useMemo indispensable : `?? {}` crée un objet neuf à chaque rendu, dont la
  // nouvelle référence relancerait le useMemo des extras en boucle.
  const variantSelected = useMemo(
    () => (isFixed ? {} : (variant?.combination ?? {})),
    [isFixed, variant],
  );

  // Chaîne primitive, donc stable d'un rendu à l'autre.
  const effectiveSize = resolveEffectiveSize(selectedFormula, variantSelected);

  // Libellé, choix unique et tarification viennent tous du produit.
  const extraGroups = useMemo(
    () => resolveExtraGroups(item, effectiveSize),
    [item, effectiveSize],
  );

  const optionById = useMemo(
    () => indexOptionsById(extraGroups),
    [extraGroups],
  );

  if (!variant) return null;

  const selectedExtras = selectedExtraIds
    .map((id) => optionById.get(id))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .map((option) => ({
      extraId: option.extra._id,
      name: option.extra.name,
      price: resolveOptionPrice(option, effectiveSize),
    }));

  const extrasTotal = selectedExtras.reduce(
    (sum, extra) => sum + extra.price,
    0,
  );

  const basePrice = isFixed
    ? selectedFormula!.price
    : variant.price + (selectedFormula?.price ?? 0);

  const unitPrice = basePrice + extrasTotal;

  // Le backend refuse une formule dont un choix manque : on bloque avant
  // l'envoi plutôt que de laisser le client se prendre un 400.
  const missingChoice = (selectedFormula?.choices ?? []).some(
    (choice) => !formulaChoices[choice.label],
  );

  // Catégorie vide ou entièrement en rupture : la formule est incommandable.
  const unavailableChoice = (selectedFormula?.choices ?? []).some(
    (choice) => (optionsByCategory[choice.fromCategoryName] ?? []).length === 0,
  );

  const isBlocked = missingChoice || unavailableChoice;

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scrolled = event.currentTarget.scrollTop > TITLE_BAR_OFFSET_PX;
    setIsScrolled((previous) => (previous === scrolled ? previous : scrolled));
  }

  function selectFormula(id: string | null) {
    setFormulaId(id);
    setFormulaChoices({}); // les choix d'une formule n'ont pas de sens sur l'autre
  }

  // Le choix unique est une propriété du GROUPE : un tacos n'a qu'un
  // gratinage, une pizza accepte plusieurs suppléments, sans que le front ait
  // à connaître le moindre nom de type.
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
        ? prev.filter((current) => current !== ingredient)
        : [...prev, ingredient],
    );
  }

  function buildLine(): NewCartLine {
    return {
      menuItemId: item._id,
      name: item.name,
      imageUrl: item.imageUrl,
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
    };
  }

  return (
    // placement="bottom" comme le ticket : sur mobile la fiche colle en bas et
    // monte à 94dvh, au lieu d'être centrée avec 16px de marge tout autour.
    // Une cinquantaine de pixels de gagnés, et le pouce atteint le pied de
    // page sans changer de prise. Au-dessus de sm, elle reste centrée.
    <Sheet
      onClose={onClose}
      labelledBy="product-sheet-title"
      placement="bottom"
    >
      {(close) => {
        function confirm() {
          if (isBlocked) return;
          if (isEditing) replaceLine(initialLine!.key, buildLine());
          else addLine(buildLine());
          close();
        }

        return (
          <>
            {/* ---------- Barre de navigation superposée ----------
                Transparente sur la photo, opaque dès qu'on descend dans les
                options : le client garde sous les yeux le nom du produit qu'il
                configure, sans qu'on lui réserve une bande en permanence. */}
            <header
              className={`absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 py-2.5 transition-colors duration-200 ${
                isScrolled
                  ? "border-b border-border-subtle bg-background/95 backdrop-blur-md"
                  : ""
              }`}
            >
              <p
                aria-hidden="true"
                className={`min-w-0 flex-1 truncate pl-1 font-heading text-base font-bold text-foreground transition-opacity duration-200 ${
                  isScrolled ? "opacity-100" : "opacity-0"
                }`}
              >
                {item.name}
              </p>

              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isScrolled
                    ? "text-foreground/75 hover:bg-surface-2 hover:text-foreground"
                    : "bg-black/45 text-white backdrop-blur-sm hover:bg-black/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="icon-[mdi--close] text-xl"
                />
              </button>
            </header>

            {/* ---------- Zone défilante ----------
                La photo est DEDANS, contrairement à avant : elle sort du champ
                dès qu'on commence à composer, au lieu de confisquer la moitié
                de l'écran pendant toute la configuration. */}
            <div
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              {/* object-contain et non object-cover : ces visuels sont des
                  produits détourés, presque carrés. "cover" remplissait la
                  boîte en rognant le pain du haut et la salade du bas — donc
                  en montrant un burger tronqué quelle que soit la hauteur
                  qu'on lui donnait. "contain" fait entrer la photo entière.
                  Corollaire : avec "contain", c'est la HAUTEUR seule qui fixe
                  la taille du produit — élargir le cadre n'y change rien.
                  sm:h-80 plutôt que h-96 : les 64px rendus permettent à la
                  section « Retirer » de tenir au-dessus du pied de page.
                  Le dégradé descend vers la couleur de la fiche : la jonction
                  photo/titre disparaît au lieu de marquer une frontière. */}
              <div className="relative h-90 w-full overflow-hidden bg-linear-to-b from-surface-2 to-background ">
                {/* Halo de studio. Un aplat uniforme derrière un détourage
                    donne un sticker collé sur un mur ; un dégradé radial
                    centré un peu haut simule la source lumineuse qui a servi
                    à la prise de vue. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-radial-[at_50%_38%] from-primary/12 via-primary/4 to-transparent"
                />

                {item.imageUrl ? (
                  <>
                    {/* Ombre de contact : l'ellipse floue est ce qui pose
                        l'objet sur une surface au lieu de le laisser en
                        apesanteur. C'est le détail qui sépare une photo de
                        catalogue d'un PNG posé là. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-6 mx-auto h-4 w-2/5 rounded-[50%] bg-black/20 blur-md"
                    />
                    {/* relative obligatoire : sans lui, l'image non
                        positionnée passe SOUS le halo et l'ombre. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="relative h-full w-full object-contain motion-safe:animate-[dishIn_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
                    />
                  </>
                ) : (
                  <div className="relative flex h-full items-center justify-center">
                    <span className="icon-[mdi--food] text-5xl text-primary/30" />
                  </div>
                )}
              </div>

              {/* Titre et description SOUS la photo, en texte normal — plus en
                  surimpression. Une description de tacos sur trois lignes
                  masquait la garniture, et le texte blanc sur photo claire
                  était par endroits illisible.
                  Pas de marge négative : object-contain laisse déjà une marge
                  naturelle sous le produit, remonter le titre le collerait à
                  la salade. */}
              <div className="flex flex-col gap-1 px-4 pt-1">
                <h2
                  id="product-sheet-title"
                  className="font-heading text-2xl font-bold leading-tight text-foreground"
                >
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-sm leading-relaxed text-foreground/75">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-5 px-4 pb-5 pt-4">
                {eligibleFormulas.length > 0 && (
                  <Field title="Formule">
                    <div className="flex flex-wrap gap-2">
                      <Choice
                        isSelected={formulaId === null}
                        onClick={() => selectFormula(null)}
                      >
                        Seul
                        <span className="tabular-nums text-xs font-normal opacity-70">
                          {formatDA(variant.price)}
                        </span>
                      </Choice>

                      {eligibleFormulas.map((formula) => (
                        <Choice
                          key={formula.id}
                          tone="mustard"
                          isSelected={formulaId === formula.id}
                          onClick={() => selectFormula(formula.id)}
                        >
                          {formula.name}
                          {/* Toujours le prix TOTAL, comme sur « Seul » : à
                              côté de « Menu Kids 500 DA », un « Menu +250 DA »
                              obligeait le client à additionner pour comparer
                              deux formules qui ne se lisent pas pareil. */}
                          <span className="tabular-nums text-xs font-normal opacity-70">
                            {formatDA(
                              formula.pricingMode === "fixed"
                                ? formula.price
                                : variant.price + formula.price,
                            )}
                          </span>
                        </Choice>
                      ))}
                    </div>

                    {selectedFormula &&
                      selectedFormula.includedNames.length > 0 && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-green">
                          <span className="icon-[mdi--check-circle] text-sm" />
                          Inclus : {selectedFormula.includedNames.join(", ")}
                        </p>
                      )}
                  </Field>
                )}

                {/* Choix imposés par la formule (boisson...) — les options
                    viennent du menu réel, pas d'une liste figée. */}
                {(selectedFormula?.choices ?? []).map((choice) => {
                  const options =
                    optionsByCategory[choice.fromCategoryName] ?? [];

                  return (
                    <Field
                      key={choice.label}
                      title={choice.label}
                      hint={{ label: "à choisir", required: true }}
                    >
                      {options.length === 0 ? (
                        <p className="rounded-xl bg-accent-bordeaux/10 px-3 py-2 text-xs text-accent-bordeaux">
                          Aucune option disponible pour le moment. Choisissez
                          une autre formule.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {options.map((option) => (
                            <Choice
                              key={option}
                              tone="green"
                              isSelected={
                                formulaChoices[choice.label] === option
                              }
                              onClick={() =>
                                setFormulaChoices((prev) => ({
                                  ...prev,
                                  [choice.label]: option,
                                }))
                              }
                            >
                              {option}
                            </Choice>
                          ))}
                        </div>
                      )}
                    </Field>
                  );
                })}

                {/* Variantes — masquées quand la formule impose un format unique */}
                {!isFixed && item.variants.length > 1 && (
                  <Field title="Taille">
                    <div className="flex flex-wrap gap-2">
                      {item.variants.map((current, index) => (
                        <Choice
                          key={index}
                          isSelected={variantIndex === index}
                          onClick={() => setVariantIndex(index)}
                        >
                          {formatVariantLabel(current.combination)}
                          <span className="tabular-nums text-xs font-normal opacity-70">
                            {formatDA(current.price)}
                          </span>
                        </Choice>
                      ))}
                    </div>
                  </Field>
                )}

                {isFixed && item.variants.length > 1 && (
                  <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-foreground/75">
                    Format unique en {selectedFormula!.name} — pas de taille à
                    choisir.
                  </p>
                )}

                {/* Un bloc par groupe déclaré sur le produit : « Gratinage » sur
                    un tacos, « Suppléments » sur une pizza, chacun avec sa
                    propre règle de choix. */}
                {extraGroups.map((group, groupIndex) => (
                  <Field
                    key={group.label}
                    title={group.label}
                    hint={
                      group.singleChoice
                        ? { label: "un seul choix" }
                        : { label: "facultatif" }
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isSelected = selectedExtraIds.includes(
                          option.extra._id,
                        );
                        const price = resolveOptionPrice(option, effectiveSize);

                        return (
                          <Choice
                            key={option.extra._id}
                            tone="green"
                            isSelected={isSelected}
                            onClick={() =>
                              toggleExtra(groupIndex, option.extra._id)
                            }
                          >
                            <span
                              className={`${
                                isSelected
                                  ? "icon-[mdi--check-circle]"
                                  : "icon-[mdi--plus-circle-outline]"
                              } text-base`}
                            />
                            {option.extra.name}
                            {price > 0 && (
                              <span className="tabular-nums text-xs font-normal opacity-70">
                                +{formatDA(price)}
                              </span>
                            )}
                          </Choice>
                        );
                      })}
                    </div>
                  </Field>
                ))}

                {item.removableIngredients &&
                  item.removableIngredients.length > 0 && (
                    <Field title="Retirer" hint={{ label: "facultatif" }}>
                      <div className="flex flex-wrap gap-2">
                        {item.removableIngredients.map((ingredient) => {
                          const isExcluded = excluded.includes(ingredient);

                          return (
                            <button
                              key={ingredient}
                              type="button"
                              onClick={() => toggleExcluded(ingredient)}
                              aria-pressed={isExcluded}
                              className={`flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                                isExcluded
                                  ? "border-accent-bordeaux bg-accent-bordeaux/10 text-accent-bordeaux line-through"
                                  : "border-border-subtle text-foreground/70 hover:border-primary/50"
                              }`}
                            >
                              <span
                                className={`${
                                  isExcluded
                                    ? "icon-[mdi--close-circle]"
                                    : "icon-[mdi--minus-circle-outline]"
                                } text-base`}
                              />
                              {ingredient}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      removeLine(initialLine!.key);
                      close();
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-accent-bordeaux/30 py-3 text-sm font-bold text-accent-bordeaux transition-colors hover:bg-accent-bordeaux/10"
                  >
                    <span className="icon-[mdi--trash-can-outline] text-base" />
                    Retirer du panier
                  </button>
                )}
              </div>
            </div>

            {/* Fondu au-dessus du pied fixe : sans lui, une section coupée par
                la barre du bas a l'air d'être la fin de la fiche, et le client
                ne descend jamais voir les ingrédients à retirer.
                bottom-20 ≈ la hauteur du pied, pour que le dégradé se pose
                juste dessus. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-20 z-10 h-6 bg-linear-to-t from-background to-transparent"
            />

            {/* ---------- Pied fixe : quantité + ajout ---------- */}
            <div
              className="relative z-10 flex shrink-0 items-center gap-3 border-t border-border-subtle bg-background p-4"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex shrink-0 items-center gap-1 rounded-xl bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Diminuer la quantité"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-background disabled:opacity-30"
                >
                  <span className="icon-[mdi--minus] text-lg" />
                </button>
                <span className="tabular-nums w-7 text-center font-heading text-base font-bold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Augmenter la quantité"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-background"
                >
                  <span className="icon-[mdi--plus] text-lg" />
                </button>
              </div>

              <button
                type="button"
                onClick={confirm}
                disabled={isBlocked}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 font-bold text-on-primary transition-all hover:bg-accent-slate active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              >
                {missingChoice ? (
                  "Choisissez d'abord vos options"
                ) : (
                  <>
                    {isEditing ? "Mettre à jour" : "Ajouter"}
                    {/* key sur le montant : React remonte l'élément à chaque
                        changement de prix, ce qui rejoue l'animation. C'est le
                        seul retour visuel qui confirme qu'ajouter une formule
                        ou un extra a bien changé ce que le client va payer —
                        même mécanique que la pastille du CartButton. */}
                    <span
                      key={unitPrice * quantity}
                      className="tabular-nums motion-safe:animate-[toastIn_0.2s_ease-out]"
                    >
                      · {formatDA(unitPrice * quantity)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        );
      }}
    </Sheet>
  );
}
