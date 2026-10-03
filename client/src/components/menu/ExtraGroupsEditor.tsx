"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useGetMenuExtrasQuery } from "@/features/menu/menuExtraApi";
import { getExtraTypeName } from "@/lib/extraPrice";
import { formatDA } from "@/lib/format";
import type {
  CreateMenuItemExtraGroupPayload,
  MenuExtra,
  MenuItem,
} from "@/types/menuItem";

/**
 * Mode de tarification d'un extra DANS ce groupe.
 *
 * "catalog" n'existe pas côté backend : c'est l'absence de surcharge, donc
 * l'option est envoyée avec le seul `extra`. Le représenter explicitement ici
 * évite qu'un champ prix laissé vide soit interprété comme « gratuit ».
 */
type PricingMode = "catalog" | "fixed" | "bySize";

export interface DraftOption {
  extraId: string;
  pricingMode: PricingMode;
  price: string;
  priceM: string;
  priceL: string;
}

export interface DraftGroup {
  label: string;
  singleChoice: boolean;
  options: DraftOption[];
}

/* ---------- Conversions ---------- */

function toDraftOption(option: {
  extra: MenuExtra | string;
  priceType?: "fixed" | "bySize";
  price?: number;
  pricesBySize?: { M: number; L: number };
}): DraftOption {
  return {
    extraId: typeof option.extra === "object" ? option.extra._id : option.extra,
    pricingMode: option.priceType ?? "catalog",
    price: option.price?.toString() ?? "",
    priceM: option.pricesBySize?.M.toString() ?? "",
    priceL: option.pricesBySize?.L.toString() ?? "",
  };
}

/** État initial du formulaire, depuis le produit chargé. */
export function toDraftGroups(item: MenuItem | null): DraftGroup[] {
  return (item?.extraGroups ?? []).map((group) => ({
    label: group.label,
    singleChoice: group.singleChoice,
    options: group.options.map(toDraftOption),
  }));
}

/** Payload backend. "catalog" n'envoie aucun champ de prix. */
export function toExtraGroupsPayload(
  groups: DraftGroup[],
): CreateMenuItemExtraGroupPayload[] {
  return groups.map((group) => ({
    label: group.label.trim(),
    singleChoice: group.singleChoice,
    options: group.options.map((option) => ({
      extra: option.extraId,
      ...(option.pricingMode === "fixed"
        ? { priceType: "fixed" as const, price: Number(option.price) }
        : {}),
      ...(option.pricingMode === "bySize"
        ? {
            priceType: "bySize" as const,
            pricesBySize: {
              M: Number(option.priceM),
              L: Number(option.priceL),
            },
          }
        : {}),
    })),
  }));
}

/**
 * Contrôles que le backend refuserait, formulés en clair.
 *
 * Le schéma Zod rejette déjà un priceType sans son prix, mais son message
 * arrive après l'envoi et sans dire quel groupe est en cause.
 */
export function validateExtraGroups(groups: DraftGroup[]): string | null {
  for (const group of groups) {
    if (!group.label.trim()) {
      return "Chaque groupe d'extras doit avoir un libellé";
    }

    for (const option of group.options) {
      if (option.pricingMode === "fixed" && !option.price) {
        return `Prix manquant dans le groupe "${group.label}"`;
      }
      if (
        option.pricingMode === "bySize" &&
        (!option.priceM || !option.priceL)
      ) {
        return `Prix M et L requis dans le groupe "${group.label}"`;
      }
    }
  }

  return null;
}

/* ---------- Composant ---------- */

interface ExtraGroupsEditorProps {
  groups: DraftGroup[];
  onChange: (groups: DraftGroup[]) => void;
  /** availableExtras du produit, s'il n'a pas encore été migré. */
  legacyExtraIds: string[];
}

function describeCatalogPrice(extra: MenuExtra): string {
  if (extra.priceType === "fixed") return formatDA(extra.price ?? 0);
  return `M ${formatDA(extra.pricesBySize?.M ?? 0)} · L ${formatDA(
    extra.pricesBySize?.L ?? 0,
  )}`;
}

export function ExtraGroupsEditor({
  groups,
  onChange,
  legacyExtraIds,
}: ExtraGroupsEditorProps) {
  const { data: extras } = useGetMenuExtrasQuery();

  // Un seul groupe ouvert à la fois. Dépliés, six groupes réaffichent chacun
  // les vingt extras du catalogue : 120 chips à traverser pour en cocher huit.
  // Fermé, un groupe tient sur une ligne et son résumé suffit à vérifier que
  // le produit est bien configuré.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const extraById = useMemo(
    () => new Map((extras ?? []).map((extra) => [extra._id, extra])),
    [extras],
  );

  // Un même extra dans deux groupes casserait l'index du backend
  // (buildExtraContext, où la dernière occurrence gagne) : le prix appliqué
  // dépendrait alors de l'ordre des groupes. On l'interdit à la saisie.
  const usedByGroupIndex = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach((group, index) => {
      group.options.forEach((option) => map.set(option.extraId, index));
    });
    return map;
  }, [groups]);

  function updateGroup(index: number, patch: Partial<DraftGroup>) {
    onChange(
      groups.map((group, i) => (i === index ? { ...group, ...patch } : group)),
    );
  }

  function addGroup() {
    onChange([...groups, { label: "", singleChoice: false, options: [] }]);
    // Ouvre le nouveau groupe : il est vide, le laisser replié n'aurait aucun
    // intérêt.
    setOpenIndex(groups.length);
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, i) => i !== index));
    setOpenIndex(null);
  }

  function toggleOption(groupIndex: number, extraId: string) {
    const group = groups[groupIndex];
    if (!group) return;

    const exists = group.options.some((option) => option.extraId === extraId);

    updateGroup(groupIndex, {
      options: exists
        ? group.options.filter((option) => option.extraId !== extraId)
        : [
            ...group.options,
            {
              extraId,
              pricingMode: "catalog",
              price: "",
              priceM: "",
              priceL: "",
            },
          ],
    });
  }

  function updateOption(
    groupIndex: number,
    extraId: string,
    patch: Partial<DraftOption>,
  ) {
    const group = groups[groupIndex];
    if (!group) return;

    updateGroup(groupIndex, {
      options: group.options.map((option) =>
        option.extraId === extraId ? { ...option, ...patch } : option,
      ),
    });
  }

  // Reprend l'ancien modèle en groupant par type d'extra — même logique que
  // scripts/migrateExtraGroups.ts. Ouvrir puis enregistrer un vieux produit
  // suffit donc à le migrer, sans relancer le script.
  function importLegacy() {
    const byLabel = new Map<string, string[]>();

    for (const extraId of legacyExtraIds) {
      const extra = extraById.get(extraId);
      if (!extra) continue;

      const label = getExtraTypeName(extra);
      byLabel.set(label, [...(byLabel.get(label) ?? []), extraId]);
    }

    onChange(
      [...byLabel.entries()].map(([label, extraIds]) => ({
        label,
        // Un gratinage ne se cumule pas ; le reste, si.
        singleChoice: label.toLowerCase().includes("gratinage"),
        options: extraIds.map((extraId) => ({
          extraId,
          pricingMode: "catalog" as const,
          price: "",
          priceM: "",
          priceL: "",
        })),
      })),
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-foreground">
          Groupes d&apos;extras
        </label>
        <p className="text-xs text-foreground/75">
          Le libellé et la règle de choix appartiennent au produit : « Gratinage
          » sur un tacos, « Suppléments » sur une pizza, avec le même fromage en
          base.
        </p>
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center">
          <p className="text-sm text-foreground/75">
            Aucun groupe — ce produit ne proposera aucun extra.
          </p>
          {legacyExtraIds.length > 0 && (
            <>
              <p className="text-xs text-foreground/45">
                Il utilise encore l&apos;ancien modèle ({legacyExtraIds.length}{" "}
                extra{legacyExtraIds.length > 1 ? "s" : ""}).
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="icon-[mdi--auto-fix]"
                onClick={importLegacy}
              >
                Reprendre et grouper par type
              </Button>
            </>
          )}
        </div>
      )}

      {groups.map((group, groupIndex) => {
        const isOpen = openIndex === groupIndex;

        return (
          <div
            key={groupIndex}
            className="overflow-hidden rounded-xl border border-border-subtle bg-surface-2/50"
          >
            {/* En-tête toujours visible : le résumé suffit à vérifier la
                configuration d'un produit sans rien déplier. */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : groupIndex)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`${
                    isOpen
                      ? "icon-[mdi--chevron-down]"
                      : "icon-[mdi--chevron-right]"
                  } shrink-0 text-lg text-foreground/40`}
                />
                <span className="truncate font-semibold text-foreground">
                  {group.label || "Sans libellé"}
                </span>
                <span className="tabular-nums shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-foreground/75">
                  {group.options.length}
                </span>
                {group.singleChoice && (
                  <span className="shrink-0 rounded-full bg-accent-mustard/15 px-2 py-0.5 text-xs font-semibold text-accent-mustard">
                    choix unique
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => removeGroup(groupIndex)}
                aria-label={`Supprimer le groupe ${
                  group.label || groupIndex + 1
                }`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux"
              >
                <span className="icon-[mdi--trash-can-outline] text-base" />
              </button>
            </div>

            {isOpen && (
              <div className="flex flex-col gap-3 border-t border-border-subtle p-3">
                <Input
                  label="Libellé du groupe"
                  placeholder="Gratinage, Suppléments, Sauces..."
                  value={group.label}
                  onChange={(e) =>
                    updateGroup(groupIndex, { label: e.target.value })
                  }
                />

                <Switch
                  checked={group.singleChoice}
                  onChange={(next) =>
                    updateGroup(groupIndex, { singleChoice: next })
                  }
                  label="Un seul choix possible dans ce groupe"
                />

                {/* Les extras retenus remontent en tête : sans ce tri, les
                    huit cochés sont noyés au milieu des vingt autres. */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-foreground/75">
                    Extras de ce groupe
                  </p>
                  <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
                    {[...(extras ?? [])]
                      .sort((a, b) => {
                        const aIn = usedByGroupIndex.get(a._id) === groupIndex;
                        const bIn = usedByGroupIndex.get(b._id) === groupIndex;
                        return aIn === bIn ? 0 : aIn ? -1 : 1;
                      })
                      .map((extra) => {
                        const owner = usedByGroupIndex.get(extra._id);
                        const isSelected = owner === groupIndex;
                        const isTakenElsewhere =
                          owner !== undefined && !isSelected;

                        return (
                          <button
                            key={extra._id}
                            type="button"
                            disabled={isTakenElsewhere}
                            onClick={() => toggleOption(groupIndex, extra._id)}
                            title={
                              isTakenElsewhere
                                ? `Déjà dans "${
                                    groups[owner]?.label || owner + 1
                                  }"`
                                : describeCatalogPrice(extra)
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : isTakenElsewhere
                                  ? "cursor-not-allowed border-border-subtle text-foreground/25"
                                  : "border-border-subtle text-foreground/75 hover:border-primary/50"
                            }`}
                          >
                            {extra.name}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Tarification, une ligne par extra retenu. Laisser
                    « Catalogue » partout est le cas normal — la surcharge ne
                    sert qu'aux extras facturés différemment selon le produit. */}
                {group.options.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border-subtle pt-2.5">
                    <p className="text-xs font-semibold text-foreground/75">
                      Prix dans ce groupe
                    </p>

                    {group.options.map((option) => {
                      const extra = extraById.get(option.extraId);

                      return (
                        <div
                          key={option.extraId}
                          className="flex flex-wrap items-end gap-2"
                        >
                          <span className="min-w-24 flex-1 truncate pb-3 text-sm font-semibold text-foreground">
                            {extra?.name ?? "Extra supprimé"}
                          </span>

                          <Select
                            value={option.pricingMode}
                            onChange={(e) =>
                              updateOption(groupIndex, option.extraId, {
                                pricingMode: e.target.value as PricingMode,
                              })
                            }
                            options={[
                              {
                                value: "catalog",
                                label: extra
                                  ? `Catalogue (${describeCatalogPrice(extra)})`
                                  : "Catalogue",
                              },
                              { value: "fixed", label: "Prix fixe" },
                              { value: "bySize", label: "Par taille" },
                            ]}
                            className="w-44"
                          />

                          {option.pricingMode === "fixed" && (
                            <Input
                              type="number"
                              min={0}
                              placeholder="Prix"
                              value={option.price}
                              onChange={(e) =>
                                updateOption(groupIndex, option.extraId, {
                                  price: e.target.value,
                                })
                              }
                              className="w-24"
                            />
                          )}

                          {option.pricingMode === "bySize" && (
                            <>
                              <Input
                                type="number"
                                min={0}
                                placeholder="M"
                                value={option.priceM}
                                onChange={(e) =>
                                  updateOption(groupIndex, option.extraId, {
                                    priceM: e.target.value,
                                  })
                                }
                                className="w-20"
                              />
                              <Input
                                type="number"
                                min={0}
                                placeholder="L"
                                value={option.priceL}
                                onChange={(e) =>
                                  updateOption(groupIndex, option.extraId, {
                                    priceL: e.target.value,
                                  })
                                }
                                className="w-20"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon="icon-[mdi--plus]"
        onClick={addGroup}
      >
        Ajouter un groupe
      </Button>
    </div>
  );
}
