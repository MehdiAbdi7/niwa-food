/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useGetMenuExtraTypesQuery } from "@/features/menu/menuExtraTypeApi";
import {
  useCreateMenuExtraMutation,
  useUpdateMenuExtraMutation,
} from "@/features/menu/menuExtraApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ExtraPriceType, MenuExtra } from "@/types/menuItem";

interface MenuExtraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  extra: MenuExtra | null;
}

export function MenuExtraFormModal({
  isOpen,
  onClose,
  extra,
}: MenuExtraFormModalProps) {
  const isEditing = extra !== null;
  const { data: types } = useGetMenuExtraTypesQuery();

  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [priceType, setPriceType] = useState<ExtraPriceType>("fixed");
  const [price, setPrice] = useState("");
  const [priceM, setPriceM] = useState("");
  const [priceL, setPriceL] = useState("");
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createExtra, { isLoading: isCreating }] = useCreateMenuExtraMutation();
  const [updateExtra, { isLoading: isUpdating }] = useUpdateMenuExtraMutation();
  const toast = useToast();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    setName(extra?.name ?? "");
    setTypeId(
      typeof extra?.type === "object" ? extra.type._id : (extra?.type ?? ""),
    );
    setPriceType(extra?.priceType ?? "fixed");
    setPrice(extra?.price?.toString() ?? "");
    setPriceM(extra?.pricesBySize?.M.toString() ?? "");
    setPriceL(extra?.pricesBySize?.L.toString() ?? "");
    setAvailable(extra?.available ?? true);
    setError(null);
  }, [isOpen, extra]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!typeId) {
      setError("Choisis un type d'extra");
      return;
    }

    const payload = {
      name,
      type: typeId,
      priceType,
      available,
      ...(priceType === "fixed"
        ? { price: Number(price) }
        : { pricesBySize: { M: Number(priceM), L: Number(priceL) } }),
    };

    try {
      if (isEditing) {
        await updateExtra({ id: extra._id, body: payload }).unwrap();
        toast.success("Extra mis à jour");
      } else {
        await createExtra(payload).unwrap();
        toast.success("Extra créé");
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier l'extra" : "Nouvel extra"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" form="extra-form" isLoading={isLoading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="extra-form"
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
        <Select
          id="type"
          label="Type"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          placeholder="Choisir un type"
          options={(types ?? []).map((t) => ({ value: t._id, label: t.name }))}
        />
        <Select
          id="priceType"
          label="Mode de prix"
          value={priceType}
          onChange={(e) => setPriceType(e.target.value as ExtraPriceType)}
          options={[
            { value: "fixed", label: "Prix fixe" },
            { value: "bySize", label: "Par taille (M / L)" },
          ]}
        />

        {priceType === "fixed" ? (
          <Input
            id="price"
            label="Prix (DA)"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        ) : (
          <div className="flex gap-3">
            <Input
              id="priceM"
              label="Prix M (DA)"
              type="number"
              min={0}
              value={priceM}
              onChange={(e) => setPriceM(e.target.value)}
              required
            />
            <Input
              id="priceL"
              label="Prix L (DA)"
              type="number"
              min={0}
              value={priceL}
              onChange={(e) => setPriceL(e.target.value)}
              required
            />
          </div>
        )}

        <Switch
          checked={available}
          onChange={setAvailable}
          label="Extra disponible"
        />
        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
