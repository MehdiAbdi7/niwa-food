"use client";

import { useState } from "react";
import type { RestaurantTable } from "@/types/table";
import { useFreeTableMutation, useDeleteTableMutation } from "@/features/tables/tableApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface TableCardProps {
  table: RestaurantTable;
  isAdmin: boolean;
  onEdit: () => void;
}

export function TableCard({ table, isAdmin, onEdit }: TableCardProps) {
  const [freeTable, { isLoading: isFreeing }] = useFreeTableMutation();
  const [deleteTable, { isLoading: isDeleting }] = useDeleteTableMutation();
  const toast = useToast();

  const [isFreeConfirmOpen, setIsFreeConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const isOccupied = table.status === "occupied";

  async function handleFree() {
    try {
      await freeTable(table._id).unwrap();
      toast.success(`Table ${table.tableN} libérée`);
      setIsFreeConfirmOpen(false);
    } catch (err) {
      // Le backend refuse (409) si une commande pending/ready est encore active
      toast.error(getApiErrorMessage(err, "Impossible de libérer cette table"));
    }
  }

  async function handleDelete() {
    try {
      await deleteTable(table._id).unwrap();
      toast.success(`Table ${table.tableN} supprimée`);
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de supprimer cette table"));
    }
  }

  return (
    <>
      <div
        className={`flex flex-col gap-3 rounded-[1.25rem] border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-food-sm ${
          isOccupied
            ? "border-accent-mustard/40 bg-accent-mustard/5"
            : "border-accent-green/30 bg-accent-green/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-2xl font-bold text-foreground">
            #{table.tableN}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              isOccupied
                ? "bg-accent-mustard/20 text-accent-mustard"
                : "bg-accent-green/20 text-accent-green"
            }`}
          >
            <span
              className={`${isOccupied ? "icon-[mdi--account-group]" : "icon-[mdi--check-circle-outline]"} text-sm`}
            />
            {isOccupied ? "Occupée" : "Libre"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOccupied && (
            <button
              onClick={() => setIsFreeConfirmOpen(true)}
              className="flex-1 rounded-lg bg-surface-2 py-2 text-xs font-bold text-foreground/80 transition-colors hover:bg-accent-green/15 hover:text-accent-green"
            >
              Libérer
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={onEdit}
                aria-label="Modifier la table"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-foreground/75 hover:text-foreground"
              >
                <span className="icon-[mdi--pencil-outline] text-base" />
              </button>
              {!isOccupied && (
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  aria-label="Supprimer la table"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-foreground/75 hover:text-accent-bordeaux"
                >
                  <span className="icon-[mdi--trash-can-outline] text-base" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isFreeConfirmOpen}
        onClose={() => setIsFreeConfirmOpen(false)}
        onConfirm={handleFree}
        title={`Libérer la table ${table.tableN} ?`}
        description="À utiliser si la commande a été encaissée ou annulée hors du flux normal."
        confirmLabel="Libérer"
        isLoading={isFreeing}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Supprimer la table ${table.tableN} ?`}
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
