/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import {
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
} from "@/features/menu/menuCategoryApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import type { MenuCategory } from "@/types/menuItem";

interface MenuCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: MenuCategory | null;
}

export function MenuCategoryFormModal({
  isOpen,
  onClose,
  category,
}: MenuCategoryFormModalProps) {
  const isEditing = category !== null;
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createCategory, { isLoading: isCreating }] =
    useCreateMenuCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateMenuCategoryMutation();
  const toast = useToast();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    setName(category?.name ?? "");
    setIsActive(category?.isActive ?? true);
    setError(null);
  }, [isOpen, category]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEditing) {
        await updateCategory({
          id: category._id,
          body: { name, isActive },
        }).unwrap();
        toast.success("Catégorie mise à jour");
      } else {
        await createCategory({ name, isActive }).unwrap();
        toast.success("Catégorie créée");
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Ce nom de catégorie existe déjà"));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" form="category-form" isLoading={isLoading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          id="name"
          label="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Switch
          checked={isActive}
          onChange={setIsActive}
          label="Catégorie active"
        />
        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
