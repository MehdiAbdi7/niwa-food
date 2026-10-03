"use client";

import { useState } from "react";
import { useGetMenuExtraTypesQuery, useDeleteMenuExtraTypeMutation } from "@/features/menu/menuExtraTypeApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MenuExtraTypeFormModal } from "./MenuExtraTypeFormModal";
import type { MenuExtraType } from "@/types/menuItem";

export function MenuExtraTypesTab() {
  const { isAdmin } = useAuth();
  const { data: types, isLoading, isError } = useGetMenuExtraTypesQuery();
  const [deleteType, { isLoading: isDeleting }] = useDeleteMenuExtraTypeMutation();
  const toast = useToast();

  const [editingType, setEditingType] = useState<MenuExtraType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingType, setDeletingType] = useState<MenuExtraType | null>(null);

  async function handleDelete() {
    if (!deletingType) return;
    try {
      await deleteType(deletingType._id).unwrap();
      toast.success("Type supprimé");
      setDeletingType(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de supprimer ce type"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <EmptyState icon="icon-[mdi--cloud-off-outline]" title="Impossible de charger les types" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button icon="icon-[mdi--plus]" onClick={() => setIsCreating(true)}>
            Nouveau type
          </Button>
        </div>
      )}

      {!types || types.length === 0 ? (
        <EmptyState icon="icon-[mdi--tag-outline]" title="Aucun type d'extra" />
      ) : (
        <div className="flex flex-col gap-2">
          {types.map((type) => (
            <div
              key={type._id}
              className="surface-card flex items-center justify-between px-4 py-3 transition-shadow hover:shadow-food-sm"
            >
              <span className="font-semibold text-foreground">{type.name}</span>
              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingType(type)}
                    aria-label="Modifier"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-surface-2 hover:text-foreground"
                  >
                    <span className="icon-[mdi--pencil-outline] text-base" />
                  </button>
                  <button
                    onClick={() => setDeletingType(type)}
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

      <MenuExtraTypeFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        extraType={null}
      />
      <MenuExtraTypeFormModal
        isOpen={editingType !== null}
        onClose={() => setEditingType(null)}
        extraType={editingType}
      />
      <ConfirmDialog
        isOpen={deletingType !== null}
        onClose={() => setDeletingType(null)}
        onConfirm={handleDelete}
        title={`Supprimer "${deletingType?.name}" ?`}
        description="Les extras rattachés à ce type ne seront pas supprimés automatiquement."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
