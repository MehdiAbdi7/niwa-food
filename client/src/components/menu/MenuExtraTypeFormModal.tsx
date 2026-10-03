/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  useCreateMenuExtraTypeMutation,
  useUpdateMenuExtraTypeMutation,
} from "@/features/menu/menuExtraTypeApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import type { MenuExtraType } from "@/types/menuItem";

interface MenuExtraTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraType: MenuExtraType | null;
}

export function MenuExtraTypeFormModal({
  isOpen,
  onClose,
  extraType,
}: MenuExtraTypeFormModalProps) {
  const isEditing = extraType !== null;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createType, { isLoading: isCreating }] =
    useCreateMenuExtraTypeMutation();
  const [updateType, { isLoading: isUpdating }] =
    useUpdateMenuExtraTypeMutation();
  const toast = useToast();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    setName(extraType?.name ?? "");
    setError(null);
  }, [isOpen, extraType]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEditing) {
        await updateType({ id: extraType._id, body: { name } }).unwrap();
        toast.success("Type mis à jour");
      } else {
        await createType({ name }).unwrap();
        toast.success("Type créé");
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Ce nom existe déjà"));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier le type" : "Nouveau type d'extra"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" form="extra-type-form" isLoading={isLoading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="extra-type-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          id="name"
          label="Nom (ex: Gratinage, Sauce...)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
