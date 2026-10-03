"use client";

import { useItemCart } from "./useItemCart";
import { ItemPickerList } from "./ItemPickerList";
import { useAddItemsToOrderMutation } from "@/features/orders/orderApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/Button";

interface AddItemsPanelProps {
  orderId: string;
  onDone: () => void;
}

// Ajout rapide d'articles à une commande existante (oubli, ajout en cours de
// repas...). Voir useItemCart pour les limites volontaires du panier.
export function AddItemsPanel({ orderId, onDone }: AddItemsPanelProps) {
  const { cart, addLine, removeFromCart, toPayload } = useItemCart();
  const [addItems, { isLoading }] = useAddItemsToOrderMutation();
  const toast = useToast();

  async function handleSubmit() {
    if (cart.length === 0) return;
    try {
      await addItems({ id: orderId, items: toPayload() }).unwrap();
      toast.success("Articles ajoutés à la commande");
      onDone();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter ces articles"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ItemPickerList cart={cart} onAdd={addLine} onRemove={removeFromCart} />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={cart.length === 0} isLoading={isLoading}>
          Ajouter à la commande
        </Button>
      </div>
    </div>
  );
}
