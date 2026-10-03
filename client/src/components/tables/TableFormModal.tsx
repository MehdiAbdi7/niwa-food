"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateTableMutation, useUpdateTableMutation } from "@/features/tables/tableApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { STORES, STORE_LABELS, type Store } from "@/types/store";
import type { RestaurantTable } from "@/types/table";

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTable | null; // null = création
  defaultStore?: Store;
}

export function TableFormModal({
  isOpen,
  onClose,
  table,
  defaultStore,
}: TableFormModalProps) {
  const isEditing = table !== null;

  const [tableN, setTableN] = useState(table?.tableN.toString() ?? "");
  const [store, setStore] = useState<Store>(table?.store ?? defaultStore ?? STORES[0]);
  const [error, setError] = useState<string | null>(null);

  const [createTable, { isLoading: isCreating }] = useCreateTableMutation();
  const [updateTable, { isLoading: isUpdating }] = useUpdateTableMutation();
  const toast = useToast();
  const isLoading = isCreating || isUpdating;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedN = Number(tableN);
    if (!Number.isInteger(parsedN) || parsedN < 1) {
      setError("Le numéro de table doit être un entier positif");
      return;
    }

    try {
      if (isEditing) {
        await updateTable({ id: table._id, body: { tableN: parsedN, store } }).unwrap();
        toast.success("Table mise à jour");
      } else {
        await createTable({ tableN: parsedN, store }).unwrap();
        toast.success("Table créée");
      }
      onClose();
    } catch (err) {
      // Le backend renvoie 409 sur le doublon (tableN, store) via l'index unique
      setError(getApiErrorMessage(err, "Ce numéro de table existe déjà dans ce magasin"));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier la table ${table.tableN}` : "Nouvelle table"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" form="table-form" isLoading={isLoading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form id="table-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="tableN"
          label="Numéro de table"
          type="number"
          min={1}
          value={tableN}
          onChange={(e) => setTableN(e.target.value)}
          required
        />
        <Select
          id="store"
          label="Magasin"
          value={store}
          onChange={(e) => setStore(e.target.value as Store)}
          options={STORES.map((s) => ({ value: s, label: STORE_LABELS[s] }))}
        />
        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
