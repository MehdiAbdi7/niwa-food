"use client";

import type { Order } from "@/types/order";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ElapsedTimer } from "./ElapsedTimer";
import { Button } from "@/components/ui/Button";
import { useUpdateOrderStatusMutation } from "@/features/orders/orderApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { getPrimaryAction } from "@/lib/orderTransitions";
import { formatDA } from "@/lib/format";
import { ORDER_TYPE_ICONS, ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { getDeliveryPerson } from "@/types/order";

interface OrderCardProps {
  order: Order;
  onOpenDetail: () => void;
}

export function OrderCard({ order, onOpenDetail }: OrderCardProps) {
  const [updateStatus, { isLoading }] = useUpdateOrderStatusMutation();
  const toast = useToast();

  const primaryAction = getPrimaryAction(order);
  const deliveryPerson = getDeliveryPerson(order);
  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const tableLabel =
    order.type === "dine_in" && order.table && typeof order.table === "object"
      ? `Table ${order.table.tableN}`
      : null;

  // L'envoi en livraison demande de choisir un livreur : ça ne tient pas sur
  // une carte de kanban, donc le bouton ouvre la fiche, où la modale de choix
  // a la place de s'afficher. Toutes les autres transitions restent en un clic.
  const opensDetail = primaryAction?.status === "out_for_delivery";

  async function handlePrimaryAction(e: React.MouseEvent) {
    e.stopPropagation(); // la carte entière ouvre le détail, le bouton ne doit pas le déclencher aussi
    if (!primaryAction) return;

    if (opensDetail) {
      onOpenDetail();
      return;
    }

    try {
      await updateStatus({
        id: order._id,
        status: primaryAction.status,
      }).unwrap();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour la commande"),
      );
    }
  }

  return (
    <div
      onClick={onOpenDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenDetail()}
      className="surface-card group relative flex cursor-pointer flex-col gap-3 overflow-hidden p-4 pl-5 transition-all hover:-translate-y-0.5 hover:shadow-food-sm"
    >
      {/* Liseré de couleur à gauche — identifie le statut sans avoir à lire */}
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: `var(--color-status-${order.status})` }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-3xl font-bold leading-none text-foreground">
            #{order.dailyNumber}
          </span>
        </div>
        <ElapsedTimer since={order.createdAt} />
      </div>

      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/75">
        <span className={`${ORDER_TYPE_ICONS[order.type]} text-sm`} />
        {tableLabel ?? ORDER_TYPE_LABELS[order.type]}
      </div>

      <p className="truncate text-sm font-semibold text-foreground/85">
        {order.client.fullName}
      </p>

      {/* Qui porte la course : sans ça, il faut ouvrir la fiche pour savoir
          qui rappeler quand le client s'impatiente. */}
      {deliveryPerson && (
        <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-primary">
          <span
            aria-hidden="true"
            className="icon-[mdi--moped-outline] shrink-0 text-sm"
          />
          {deliveryPerson.firstname}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border-subtle pt-3">
        <div className="flex flex-col">
          <span className="text-xs text-foreground/75">
            {itemsCount} article{itemsCount > 1 ? "s" : ""}
          </span>
          <span className="font-heading text-base font-bold text-accent-green">
            {formatDA(order.totalPrice)}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {primaryAction && (
        <Button
          size="sm"
          icon={primaryAction.icon}
          onClick={handlePrimaryAction}
          isLoading={isLoading}
          className="w-full"
        >
          {primaryAction.label}
        </Button>
      )}
    </div>
  );
}
