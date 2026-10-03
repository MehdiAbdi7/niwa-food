"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ItemPickerList } from "./ItemPickerList";
import { useItemCart } from "./useItemCart";
import { useCreateOrderMutation } from "@/features/orders/orderApi";
import { useGetTablesQuery } from "@/features/tables/tableApi";
import { useActiveStore } from "@/features/store/useActiveStore";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { STORE_LABELS, type Store } from "@/types/store";
import type { CreateOrderPayload, OrderType } from "@/types/order";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: OrderType[] = ["dine_in", "takeaway", "delivery"];

// Prend une commande au comptoir ou par téléphone — même route que le
// formulaire public /commande (POST /orders n'exige pas d'authentification
// côté backend, juste un rate-limit partagé avec les clients). Panier
// volontairement simple : voir useItemCart.
export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const { user, isAdmin } = useAuth();
  const { activeStore } = useActiveStore();
  const toast = useToast();

  const [type, setType] = useState<OrderType>("dine_in");
  const [manualStore, setManualStore] = useState<Store | "">("");
  const [tableId, setTableId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { cart, addToCart, removeFromCart, clearCart, toPayload } = useItemCart();
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  // Un employee est toujours sur son magasin ; un admin doit choisir
  // explicitement s'il est en vue "tous les magasins".
  const impliedStore = activeStore ?? user?.store;
  const needsStoreSelector = isAdmin && !impliedStore;
  const resolvedStore = impliedStore ?? (manualStore || undefined);

  const { data: tables } = useGetTablesQuery(
    { store: resolvedStore },
    { skip: type !== "dine_in" || !resolvedStore },
  );

  function resetForm() {
    setType("dine_in");
    setManualStore("");
    setTableId("");
    setFullName("");
    setPhone("");
    setAddress("");
    setRemark("");
    setError(null);
    clearCart();
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Le nom du client est requis");
      return;
    }
    if (cart.length === 0) {
      setError("Ajoute au moins un article");
      return;
    }
    if (type === "dine_in" && !tableId) {
      setError("Choisis une table");
      return;
    }
    if (type !== "dine_in" && !resolvedStore) {
      setError("Choisis un magasin");
      return;
    }
    if (type !== "dine_in" && phone.trim().length < 10) {
      setError("Le téléphone est requis (10 chiffres minimum)");
      return;
    }
    if (type === "delivery" && !address.trim()) {
      setError("L'adresse est requise pour une livraison");
      return;
    }

    const items = toPayload();
    let payload: CreateOrderPayload;

    if (type === "dine_in") {
      payload = {
        type: "dine_in",
        table: tableId,
        client: { fullName },
        remark: remark || undefined,
        items,
      };
    } else if (type === "takeaway") {
      payload = {
        type: "takeaway",
        store: resolvedStore as Store,
        client: { fullName, phone },
        remark: remark || undefined,
        items,
      };
    } else {
      payload = {
        type: "delivery",
        store: resolvedStore as Store,
        client: { fullName, phone, address },
        remark: remark || undefined,
        items,
      };
    }

    try {
      const created = await createOrder(payload).unwrap();
      toast.success(`Commande #${created.dailyNumber} créée`);
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de créer la commande"));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouvelle commande"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="create-order-form" isLoading={isSubmitting}>
            Créer la commande
          </Button>
        </>
      }
    >
      <form id="create-order-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type de commande */}
        <div className="flex gap-1.5">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-subtle text-foreground/75 hover:text-foreground"
              }`}
            >
              {ORDER_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {needsStoreSelector && (
          <Select
            id="store"
            label="Magasin"
            value={manualStore}
            onChange={(e) => {
              setManualStore(e.target.value as Store);
              setTableId(""); // la liste de tables change avec le magasin
            }}
            placeholder="Choisir un magasin"
            options={Object.entries(STORE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        )}

        {type === "dine_in" && (
          <Select
            id="table"
            label="Table"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            placeholder={resolvedStore ? "Choisir une table" : "Choisis d'abord un magasin"}
            disabled={!resolvedStore}
            options={(tables ?? [])
              .slice()
              .sort((a, b) => a.tableN - b.tableN)
              .map((t) => ({
                value: t._id,
                label: `Table ${t.tableN} — ${t.status === "occupied" ? "occupée (ajoutera à sa commande)" : "libre"}`,
              }))}
          />
        )}

        <Input
          id="fullName"
          label="Nom du client"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        {type !== "dine_in" && (
          <Input
            id="phone"
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        )}

        {type === "delivery" && (
          <Input
            id="address"
            label="Adresse de livraison"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        )}

        <Input
          id="remark"
          label="Remarque (optionnel)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />

        <div className="border-t border-border-subtle pt-4">
          <ItemPickerList cart={cart} onAdd={addToCart} onRemove={removeFromCart} />
        </div>

        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
