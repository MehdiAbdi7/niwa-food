"use client";

import { useState } from "react";
import { useGetMenuCategoriesQuery } from "@/features/menu/menuApi";
import { useDeleteMenuCategoryMutation } from "@/features/menu/menuCategoryApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MenuCategoryFormModal } from "./MenuCategoryFormModal";
import type { MenuCategory } from "@/types/menuItem";

export function MenuCategoriesTab() {
  const { isAdmin } = useAuth();
  const { data: categories, isLoading, isError } = useGetMenuCategoriesQuery();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteMenuCategoryMutation();
  const toast = useToast();

  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);

  async function handleDelete() {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory._id).unwrap();
      toast.success("Catégorie supprimée");
      setDeletingCategory(null);
    } catch (err) {
      // Aucune contrainte de cascade côté backend : si des produits
      // référencent encore cette catégorie, ils resteront orphelins.
      toast.error(getApiErrorMessage(err, "Impossible de supprimer cette catégorie"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <EmptyState icon="icon-[mdi--cloud-off-outline]" title="Impossible de charger les catégories" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button icon="icon-[mdi--plus]" onClick={() => setIsCreating(true)}>
            Nouvelle catégorie
          </Button>
        </div>
      )}

      {!categories || categories.length === 0 ? (
        <EmptyState icon="icon-[mdi--shape-outline]" title="Aucune catégorie" />
      ) : (
        <div className="flex flex-col gap-2">
          {[...categories]
            .sort((a, b) => a.order - b.order)
            .map((category) => (
              <div
                key={category._id}
                className="surface-card flex items-center justify-between px-4 py-3 transition-shadow hover:shadow-food-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      category.isActive ? "bg-accent-green" : "bg-foreground/30"
                    }`}
                  />
                  <span className="font-semibold text-foreground">{category.name}</span>
                  {!category.isActive && (
                    <span className="text-xs text-foreground/40">(inactive)</span>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingCategory(category)}
                      aria-label="Modifier"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-surface-2 hover:text-foreground"
                    >
                      <span className="icon-[mdi--pencil-outline] text-base" />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(category)}
                      aria-label="Supprimer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux"
                    >
                      <span className="icon-[mdi--trash-can-outline] text-base" />
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <MenuCategoryFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        category={null}
      />
      <MenuCategoryFormModal
        isOpen={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
      />
      <ConfirmDialog
        isOpen={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title={`Supprimer "${deletingCategory?.name}" ?`}
        description="Les produits déjà rattachés à cette catégorie ne seront pas déplacés automatiquement."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
