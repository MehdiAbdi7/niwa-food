"use client";

import { useState } from "react";
import { useGetMenuExtrasQuery } from "@/features/menu/menuExtraApi";
import { useDeleteMenuExtraMutation } from "@/features/menu/menuExtraApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDA } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MenuExtraFormModal } from "./MenuExtraFormModal";
import type { MenuExtra } from "@/types/menuItem";

function formatExtraPrice(extra: MenuExtra): string {
  if (extra.priceType === "fixed") return formatDA(extra.price ?? 0);
  return `M ${formatDA(extra.pricesBySize?.M ?? 0)} · L ${formatDA(extra.pricesBySize?.L ?? 0)}`;
}

export function MenuExtrasTab() {
  const { isAdmin } = useAuth();
  const { data: extras, isLoading, isError } = useGetMenuExtrasQuery();
  const [deleteExtra, { isLoading: isDeleting }] = useDeleteMenuExtraMutation();
  const toast = useToast();

  const [editingExtra, setEditingExtra] = useState<MenuExtra | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingExtra, setDeletingExtra] = useState<MenuExtra | null>(null);

  async function handleDelete() {
    if (!deletingExtra) return;
    try {
      await deleteExtra(deletingExtra._id).unwrap();
      toast.success("Extra supprimé");
      setDeletingExtra(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de supprimer cet extra"));
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
    return <EmptyState icon="icon-[mdi--cloud-off-outline]" title="Impossible de charger les extras" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button icon="icon-[mdi--plus]" onClick={() => setIsCreating(true)}>
            Nouvel extra
          </Button>
        </div>
      )}

      {!extras || extras.length === 0 ? (
        <EmptyState icon="icon-[mdi--cheese]" title="Aucun extra" />
      ) : (
        <div className="flex flex-col gap-2">
          {extras.map((extra) => {
            const typeName = typeof extra.type === "object" ? extra.type.name : "";
            return (
              <div
                key={extra._id}
                className="surface-card flex items-center justify-between px-4 py-3 transition-shadow hover:shadow-food-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {extra.name}
                    {!extra.available && (
                      <span className="ml-2 text-xs font-normal text-foreground/40">
                        (indisponible)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-foreground/75">
                    {typeName} · {formatExtraPrice(extra)}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingExtra(extra)}
                      aria-label="Modifier"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-surface-2 hover:text-foreground"
                    >
                      <span className="icon-[mdi--pencil-outline] text-base" />
                    </button>
                    <button
                      onClick={() => setDeletingExtra(extra)}
                      aria-label="Supprimer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux"
                    >
                      <span className="icon-[mdi--trash-can-outline] text-base" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MenuExtraFormModal isOpen={isCreating} onClose={() => setIsCreating(false)} extra={null} />
      <MenuExtraFormModal
        isOpen={editingExtra !== null}
        onClose={() => setEditingExtra(null)}
        extra={editingExtra}
      />
      <ConfirmDialog
        isOpen={deletingExtra !== null}
        onClose={() => setDeletingExtra(null)}
        onConfirm={handleDelete}
        title={`Supprimer "${deletingExtra?.name}" ?`}
        description="Les produits qui proposent cet extra ne le proposeront plus."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
