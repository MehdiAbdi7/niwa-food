"use client";

import { useMemo, useState } from "react";
import {
  useGetMenuItemsQuery,
  useGetMenuCategoriesQuery,
} from "@/features/menu/menuApi";
import {
  useCategoryGroups,
  type SectionDef,
} from "@/features/menu/useCategoryGroups";
import { useDeleteMenuItemMutation } from "@/features/menu/menuItemApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MenuItemFormModal } from "./MenuItemFormModal";
import { MenuItemCard } from "./MenuItemCard";
import type { MenuItem } from "@/types/menuItem";

function getCategoryId(item: MenuItem): string {
  return typeof item.category === "object" ? item.category._id : item.category;
}

type CategorySection = Extract<SectionDef, { kind: "category" }>;

// Chip réutilisée par les deux rangées — seule la taille change, pour que la
// hiérarchie se lise d'un coup d'œil sans avoir à comparer les couleurs.
function CategoryChip({
  label,
  count,
  isSelected,
  isSub = false,
  onClick,
}: {
  label: string;
  count: number;
  isSelected: boolean;
  isSub?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border font-bold transition-colors ${
        isSub ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        isSelected
          ? "border-primary bg-primary text-on-primary"
          : "border-border-subtle bg-surface text-foreground/70 hover:border-primary hover:text-foreground"
      }`}
    >
      {label}
      <span
        className={`tabular-nums rounded-full px-1.5 text-xs ${
          isSelected ? "bg-on-primary/20" : "bg-surface-2 text-foreground/75"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function MenuItemsTab() {
  const { isAdmin } = useAuth();
  const { data: items, isLoading, isError } = useGetMenuItemsQuery();
  const { data: categories } = useGetMenuCategoriesQuery();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteMenuItemMutation();
  const toast = useToast();

  // Même source de vérité que la carte publique : un groupe déclaré dans
  // categoryGroups.ts se répercute ici sans double configuration.
  const groups = useCategoryGroups(categories);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.label === selectedLabel) ?? null,
    [groups, selectedLabel],
  );

  // Seules les sections de type "category" donnent des sous-chips : celles de
  // type "predicate" (Pizzas, découpées par mot-clé de description) ne
  // correspondent à aucune catégorie assignable à un produit.
  const subCategories = useMemo<CategorySection[]>(() => {
    if (!selectedGroup?.sectionDefs) return [];
    return selectedGroup.sectionDefs.filter(
      (def): def is CategorySection => def.kind === "category",
    );
  }, [selectedGroup]);

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items ?? []) {
      const id = getCategoryId(item);
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const countByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of groups) {
      counts[group.label] = group.categoryIds.reduce(
        (sum, id) => sum + (countByCategory[id] ?? 0),
        0,
      );
    }
    return counts;
  }, [groups, countByCategory]);

  const filteredItems = useMemo(() => {
    // Une sous-catégorie choisie restreint au seul id ; sinon on prend tout le
    // groupe ; sinon tout le menu.
    const activeIds = subCategoryId
      ? [subCategoryId]
      : (selectedGroup?.categoryIds ?? null);

    const byCategory = activeIds
      ? (items ?? []).filter((item) => activeIds.includes(getCategoryId(item)))
      : (items ?? []);

    if (!search.trim()) return byCategory;

    // La recherche couvre aussi la description : c'est souvent par un
    // ingrédient qu'on retrouve un produit dont on a oublié le nom.
    const query = search.toLowerCase();
    return byCategory.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }, [items, selectedGroup, subCategoryId, search]);

  // Changer de groupe doit vider la sous-sélection, sinon un id de Canettes
  // resterait actif en passant sur Burgers, et la grille serait vide.
  function selectGroup(label: string | null) {
    setSelectedLabel(label);
    setSubCategoryId(null);
  }

  async function handleDelete() {
    if (!deletingItem) return;
    try {
      await deleteItem(deletingItem._id).unwrap();
      toast.success("Produit supprimé");
      setDeletingItem(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer ce produit"),
      );
    }
  }

  if (isLoading) return <SkeletonGrid count={8} />;

  if (isError) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Impossible de charger le menu"
        description="Vérifie ta connexion, puis recharge la page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Rechercher un produit ou un ingrédient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-72"
        />
        {isAdmin && (
          <Button
            icon="icon-[mdi--plus]"
            onClick={() => setIsCreating(true)}
            className="shrink-0"
          >
            Nouveau produit
          </Button>
        )}
      </div>

      {/* Rangée 1 : groupes. Le compte évite d'ouvrir un filtre vide —
          l'information est donnée avant le clic, pas après. */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        <CategoryChip
          label="Tous"
          count={items?.length ?? 0}
          isSelected={selectedLabel === null}
          onClick={() => selectGroup(null)}
        />
        {groups.map((group) => (
          <CategoryChip
            key={group.label}
            label={group.label}
            count={countByGroup[group.label] ?? 0}
            isSelected={selectedLabel === group.label}
            onClick={() => selectGroup(group.label)}
          />
        ))}
      </div>

      {/* Rangée 2 : sous-catégories du groupe ouvert. N'apparaît que si le
          groupe en fusionne plusieurs — inutile sur Salades ou Pizzas. */}
      {subCategories.length > 1 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-l-2 border-border-subtle pb-1 pl-3 sm:flex-wrap sm:overflow-visible">
          <CategoryChip
            label="Toutes"
            count={countByGroup[selectedGroup!.label] ?? 0}
            isSelected={subCategoryId === null}
            isSub
            onClick={() => setSubCategoryId(null)}
          />
          {subCategories.map((sub) => (
            <CategoryChip
              key={sub.categoryId}
              label={sub.label}
              count={countByCategory[sub.categoryId] ?? 0}
              isSelected={subCategoryId === sub.categoryId}
              isSub
              onClick={() => setSubCategoryId(sub.categoryId)}
            />
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={
            search ? "icon-[mdi--magnify-close]" : "icon-[mdi--food-outline]"
          }
          title={search ? "Aucun résultat" : "Aucun produit"}
          description={
            search
              ? "Change de catégorie ou vide la recherche."
              : isAdmin
                ? "Ajoute ton premier produit pour commencer."
                : undefined
          }
          action={
            !search &&
            isAdmin && (
              <Button
                icon="icon-[mdi--plus]"
                onClick={() => setIsCreating(true)}
              >
                Nouveau produit
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              isAdmin={isAdmin}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeletingItem(item)}
            />
          ))}
        </div>
      )}

      <MenuItemFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        item={null}
      />
      <MenuItemFormModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        item={editingItem}
      />
      <ConfirmDialog
        isOpen={deletingItem !== null}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={`Supprimer "${deletingItem?.name}" ?`}
        description="Le produit et son image associée seront définitivement supprimés."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
