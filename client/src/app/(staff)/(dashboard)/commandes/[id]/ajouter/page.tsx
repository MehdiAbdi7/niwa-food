"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MenuBrowser } from "@/components/orders/newOrder/MenuBrowser";
import { ProductConfigModal } from "@/components/orders/newOrder/ProductConfigModal";
import { TicketTotals } from "@/components/orders/newOrder/TicketTotals";
import { hasOptions } from "@/components/orders/newOrder/ProductGrid";
import { useItemCart, getLineUnitPrice } from "@/components/orders/useItemCart";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useGetOrderByIdQuery,
  useAddItemsToOrderMutation,
} from "@/features/orders/orderApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import type { MenuItem } from "@/types/menuItem";

export default function AddItemsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const toast = useToast();

  const { data: order, isLoading, isError } = useGetOrderByIdQuery(orderId);
  const [addItems, { isLoading: isSubmitting }] = useAddItemsToOrderMutation();

  const {
    cart,
    addLine,
    removeFromCart,
    setQuantity,
    toPayload,
    itemsCount,
    total,
  } = useItemCart();
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);

  const quantityByItem = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const line of cart) {
      counts[line.menuItemId] = (counts[line.menuItemId] ?? 0) + line.quantity;
    }
    return counts;
  }, [cart]);

  function handleSelectProduct(item: MenuItem) {
    if (hasOptions(item)) {
      setConfiguringItem(item);
      return;
    }
    addLine({
      menuItemId: item._id,
      name: item.name,
      imageUrl: item.imageUrl,
      variant: item.variants[0],
      extras: [],
      excludedIngredients: [],
      quantity: 1,
    });
  }

  async function handleSubmit() {
    if (cart.length === 0) return;
    try {
      await addItems({ id: orderId, items: toPayload() }).unwrap();
      toast.success(`Articles ajoutés à la commande #${order?.dailyNumber}`);
      router.push("/commandes");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter ces articles"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Commande introuvable"
        description="Elle a peut-être été supprimée entretemps."
        action={
          <Button variant="secondary" onClick={() => router.push("/commandes")}>
            Retour aux commandes
          </Button>
        }
      />
    );
  }

  const tableLabel =
    order.type === "dine_in" && order.table && typeof order.table === "object"
      ? `Table ${order.table.tableN}`
      : ORDER_TYPE_LABELS[order.type];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      {/* ---------- Colonne menu ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/commandes"
            aria-label="Retour aux commandes"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground/75 transition-colors hover:border-primary hover:text-foreground"
          >
            <span className="icon-[mdi--arrow-left] text-xl" />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold leading-tight text-foreground">
              Ajouter à la commande #{order.dailyNumber}
            </h1>
            <p className="text-sm text-foreground/75">
              {order.client.fullName} · {tableLabel}
            </p>
          </div>
        </div>

        <MenuBrowser
          quantityByItem={quantityByItem}
          onSelect={handleSelectProduct}
        />
      </div>

      {/* ---------- Ticket ---------- */}
      <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-88">
        <div className="ticket-notch surface-card relative flex flex-col gap-4 p-5 pb-7">
          {/* Déjà commandé : contexte en lecture seule, pour ne pas ressaisir
              deux fois le même article par erreur. */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground/45">
              Déjà sur la commande
            </p>
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate text-foreground/75">
                  {item.quantity}x {item.name}
                </span>
                <span className="tabular-nums shrink-0 text-foreground/45">
                  {formatDA(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 border-t border-dashed border-border-subtle pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-green">
              À ajouter
            </p>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                <span className="icon-[mdi--plus-box-outline] text-2xl text-foreground/25" />
                <p className="text-sm font-semibold text-foreground/75">
                  Rien à ajouter
                </p>
                <p className="text-xs text-foreground/40">
                  Touche un produit pour le sélectionner
                </p>
              </div>
            ) : (
              cart.map((line) => {
                const variantLabel = formatVariantLabel(
                  line.variant.combination,
                );
                return (
                  <div key={line.key} className="flex items-center gap-2.5">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-xs font-bold text-foreground">
                        {line.name}
                      </p>
                      <p className="tabular-nums text-xs text-foreground/75">
                        {line.formula?.pricingMode === "fixed"
                          ? `${line.formula.name} · `
                          : variantLabel !== "Standard"
                            ? `${variantLabel} · `
                            : ""}
                        {formatDA(getLineUnitPrice(line))}
                      </p>

                      {line.formula && (
                        <p className="truncate text-xs font-semibold text-accent-mustard">
                          {line.formula.name}
                          {line.formula.includes.length > 0 &&
                            ` : ${line.formula.includes.join(", ")}`}
                        </p>
                      )}

                      {line.excludedIngredients.length > 0 && (
                        <p className="truncate text-xs text-accent-bordeaux">
                          sans {line.excludedIngredients.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-surface-2 p-0.5">
                      <button
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        aria-label={`Retirer un ${line.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/75 hover:bg-surface hover:text-accent-bordeaux"
                      >
                        <span className="icon-[mdi--minus] text-sm" />
                      </button>
                      <span className="tabular-nums w-5 text-center text-xs font-bold text-foreground">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        aria-label={`Ajouter un ${line.name}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/75 hover:bg-surface hover:text-accent-green"
                      >
                        <span className="icon-[mdi--plus] text-sm" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(line.key)}
                      aria-label={`Supprimer ${line.name}`}
                      className="shrink-0 text-foreground/25 hover:text-accent-bordeaux"
                    >
                      <span className="icon-[mdi--close] text-base" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <TicketTotals itemsTotal={total} itemsCount={itemsCount} />

          <p className="-mt-2 text-xs text-foreground/45">
            Nouveau total de la commande : {formatDA(order.totalPrice + total)}
          </p>

          <Button
            size="lg"
            icon="icon-[mdi--check-circle-outline]"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={cart.length === 0}
            className="w-full"
          >
            Ajouter à la commande
          </Button>
        </div>
      </aside>

      <ProductConfigModal
        item={configuringItem}
        onClose={() => setConfiguringItem(null)}
        onConfirm={addLine}
      />
    </div>
  );
}
