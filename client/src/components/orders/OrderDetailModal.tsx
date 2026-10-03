"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeliveryPersonModal } from "./DeliveryPersonModal";
import {
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useSetDeliveryFeeMutation,
  useSetDeliveryPersonMutation,
  useDeleteOrderMutation,
} from "@/features/orders/orderApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { getPrimaryAction, canCancel } from "@/lib/orderTransitions";
import { formatDA, formatDateTime } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { printOrderTicket } from "@/lib/printTicket";
import { getDeliveryPerson } from "@/types/order";

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useGetOrderByIdQuery(orderId ?? "", { skip: !orderId });
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateOrderStatusMutation();
  const [setDeliveryFee, { isLoading: isSavingFee }] =
    useSetDeliveryFeeMutation();
  const [setDeliveryPerson, { isLoading: isSavingPerson }] =
    useSetDeliveryPersonMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [feeInput, setFeeInput] = useState("");
  const [isEditingFee, setIsEditingFee] = useState(false);

  // Deux usages distincts de la même modale : l'envoi en livraison (qui change
  // aussi le statut) et la simple correction d'assignation.
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);

  const isOpen = orderId !== null;

  function handleClose() {
    setIsEditingFee(false);
    onClose();
  }

  const primaryAction = order ? getPrimaryAction(order) : null;
  const deliveryPerson = order ? getDeliveryPerson(order) : null;

  // L'envoi en livraison passe par le choix du livreur : c'est un geste unique
  // au comptoir (« celle-là, c'est Karim qui la prend »), donc un seul appel.
  const needsDispatch = primaryAction?.status === "out_for_delivery";

  async function handlePrimaryAction() {
    if (!order || !primaryAction) return;

    if (needsDispatch) {
      setIsDispatchOpen(true);
      return;
    }

    try {
      await updateStatus({
        id: order._id,
        status: primaryAction.status,
      }).unwrap();
      toast.success(
        `Commande #${order.dailyNumber} — ${primaryAction.label.toLowerCase()}`,
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour la commande"),
      );
    }
  }

  async function handleDispatch(deliveryPersonId: string | null) {
    if (!order) return;
    try {
      await updateStatus({
        id: order._id,
        status: "out_for_delivery",
        deliveryPerson: deliveryPersonId,
      }).unwrap();
      toast.success(`Commande #${order.dailyNumber} partie en livraison`);
      setIsDispatchOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible d'envoyer la commande"));
    }
  }

  async function handleReassign(deliveryPersonId: string | null) {
    if (!order) return;
    try {
      await setDeliveryPerson({
        id: order._id,
        deliveryPerson: deliveryPersonId,
      }).unwrap();
      toast.success(
        deliveryPersonId ? "Livreur mis à jour" : "Livreur retiré",
      );
      setIsReassignOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de changer le livreur"));
    }
  }

  async function handleCancel() {
    if (!order) return;
    try {
      await updateStatus({ id: order._id, status: "cancelled" }).unwrap();
      toast.success("Commande annulée");
      setIsCancelConfirmOpen(false);
      handleClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible d'annuler la commande"));
    }
  }

  async function handleDelete() {
    if (!order) return;
    try {
      await deleteOrder(order._id).unwrap();
      toast.success("Commande supprimée");
      setIsDeleteConfirmOpen(false);
      handleClose();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer la commande"),
      );
    }
  }

  async function handleSaveFee(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    const parsed = Number(feeInput);
    if (Number.isNaN(parsed) || parsed < 0) return;

    try {
      await setDeliveryFee({ id: order._id, deliveryFee: parsed }).unwrap();
      toast.success("Prix de livraison mis à jour");
      setIsEditingFee(false);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour le prix"),
      );
    }
  }

  const tableLabel =
    order?.type === "dine_in" && order.table && typeof order.table === "object"
      ? `Table ${order.table.tableN}`
      : null;

  // `?? 0` obligatoire : les commandes antérieures au code promo n'ont pas ce
  // champ, et undefined dans une soustraction donnerait « NaN DA ».
  const discountAmount = order?.discountAmount ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={order ? `Commande #${order.dailyNumber}` : "Commande"}
      size="lg"
      footer={
        order && (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex gap-2">
              {canCancel(order) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  Annuler la commande
                </Button>
              )}
              {/* Un admin peut supprimer à tout statut, y compris "completed" :
                  c'est le seul moyen de retirer une commande erronée de
                  l'historique, celui-ci n'étant qu'une agrégation sur orders. */}
              {isAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  Supprimer
                </Button>
              )}
            </div>
            {primaryAction && (
              <Button
                icon={primaryAction.icon}
                onClick={handlePrimaryAction}
                isLoading={isUpdatingStatus && !needsDispatch}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        )
      }
    >
      {/* Ces trois états sont mutuellement exclusifs et couvrent tout le cycle
          de vie de la requête — avant ce correctif, une erreur réseau ou une
          permission refusée laissait la modale vide (en-tête affiché, corps
          totalement blanc), sans aucun message. */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <span className="icon-[mdi--loading] animate-spin text-3xl text-primary" />
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          icon="icon-[mdi--cloud-off-outline]"
          title="Impossible de charger cette commande"
          description="Vérifie ta connexion, ou que la commande n'a pas été supprimée entretemps."
          action={
            <Button
              variant="secondary"
              icon="icon-[mdi--refresh]"
              onClick={() => refetch()}
            >
              Réessayer
            </Button>
          }
        />
      )}

      {!isLoading && !isError && order && (
        <div className="flex flex-col gap-5">
          {/* En-tête */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground">
                {order.client.fullName}
              </p>
              <p className="text-sm text-foreground/75">
                {tableLabel ?? ORDER_TYPE_LABELS[order.type]}
                {order.client.phone && ` · ${order.client.phone}`}
              </p>
              {order.client.address && (
                <p className="text-sm text-foreground/75">
                  {order.client.address}
                </p>
              )}
              <p className="text-xs text-foreground/40">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={order.status} />
              <button
                onClick={() => printOrderTicket(order)}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground/75 hover:text-primary"
              >
                <span className="icon-[mdi--printer-outline] text-base" />
                Imprimer le ticket
              </button>
            </div>
          </div>

          {/* Code promo — en haut, avec le contexte de la commande et non
              enterré dans les totaux : quand un client conteste son montant,
              c'est la première chose que le staff doit pouvoir lire. */}
          {order.appliedPromo && (
            <div className="flex items-center gap-2.5 rounded-xl bg-accent-green/10 px-3 py-2.5">
              <span
                aria-hidden="true"
                className="icon-[mdi--ticket-percent] shrink-0 text-xl text-accent-green"
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                  {order.appliedPromo.code}
                </span>
                <span className="tabular-nums text-xs text-foreground/75">
                  −{order.appliedPromo.discountPercent}% sur les articles ·{" "}
                  {formatDA(discountAmount)} de remise
                </span>
              </div>
            </div>
          )}

          {/* Livreur — affiché dès que la commande est partie, pour que
              n'importe quel poste sache qui appeler si le client s'impatiente. */}
          {order.type === "delivery" &&
            order.status === "out_for_delivery" && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--moped-outline] shrink-0 text-xl text-primary"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {deliveryPerson
                        ? `${deliveryPerson.firstname} ${deliveryPerson.lastname}`
                        : "Sans livreur assigné"}
                    </span>
                    <span className="tabular-nums text-xs text-foreground/75">
                      {deliveryPerson?.tel ??
                        "Vous validerez la livraison ici"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsReassignOpen(true)}
                  className="shrink-0 text-xs font-bold text-primary hover:underline"
                >
                  Changer
                </button>
              </div>
            )}

          {order.remark && (
            <div className="rounded-xl bg-accent-mustard/10 px-3 py-2 text-sm text-foreground/80">
              <span className="font-semibold">Remarque : </span>
              {order.remark}
            </div>
          )}

          {/* Items */}
          <div className="flex flex-col gap-2">
            {order.items.map((item, i) => {
              // Défensif : voir variantLabel.ts — d'anciennes commandes
              // peuvent avoir ces champs à null/undefined malgré le default
              // du schéma, qui ne s'applique qu'à la création.
              const selectedExtras = item.selectedExtras ?? [];
              const excludedIngredients = item.excludedIngredients ?? [];
              const extrasTotal = selectedExtras.reduce(
                (s, e) => s + e.price,
                0,
              );
              const variantLabel = formatVariantLabel(item.variantSelected);
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border-subtle p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {item.quantity}x {item.name}
                      {variantLabel !== "Standard" && (
                        <span className="text-foreground/75">
                          {" "}
                          ({variantLabel})
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDA((item.unitPrice + extrasTotal) * item.quantity)}
                    </span>
                  </div>
                  {selectedExtras.length > 0 && (
                    <p className="mt-1 text-xs text-foreground/75">
                      + {selectedExtras.map((e) => e.name).join(", ")}
                    </p>
                  )}
                  {item.formula && (
                    <p className="mt-1 text-xs font-semibold text-accent-mustard">
                      {item.formula.name}
                      {item.formula.includes.length > 0 &&
                        ` : ${item.formula.includes.join(", ")}`}
                    </p>
                  )}
                  {excludedIngredients.length > 0 && (
                    <p className="mt-1 text-xs text-accent-bordeaux">
                      Sans : {excludedIngredients.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Remise — ligne chiffrée, juste avant la livraison. Cet ordre
              reproduit le calcul du backend : la remise porte sur les articles
              seuls, les frais de livraison sont ajoutés après et ne sont
              jamais réduits. */}
          {discountAmount > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-accent-green/10 px-3 py-2">
              <span className="text-sm font-semibold text-accent-green">
                Remise
                {order.appliedPromo &&
                  ` (${order.appliedPromo.code}, −${order.appliedPromo.discountPercent}%)`}
              </span>
              <span className="tabular-nums text-sm font-bold text-accent-green">
                −{formatDA(discountAmount)}
              </span>
            </div>
          )}

          {/* Livraison */}
          {order.type === "delivery" && (
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
              <span className="text-sm font-semibold text-foreground/80">
                Frais de livraison
              </span>
              {isEditingFee ? (
                <form
                  onSubmit={handleSaveFee}
                  className="flex items-center gap-2"
                >
                  <Input
                    type="number"
                    min={0}
                    autoFocus
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="h-9 w-24"
                  />
                  <Button type="submit" size="sm" isLoading={isSavingFee}>
                    OK
                  </Button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setFeeInput(order.deliveryFee?.toString() ?? "");
                    setIsEditingFee(true);
                  }}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {order.deliveryFee !== undefined
                    ? formatDA(order.deliveryFee)
                    : "À définir"}
                </button>
              )}
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between border-t border-border-subtle pt-3">
            <span className="font-heading text-base font-bold text-foreground">
              Total
            </span>
            <span className="font-heading text-xl font-bold text-accent-green">
              {formatDA(order.totalPrice)}
            </span>
          </div>

          {/* Ajout d'articles */}
          {!["completed", "cancelled"].includes(order.status) && (
            <div className="border-t border-border-subtle pt-4">
              {/* Page dédiée plutôt qu'un panneau dans la modale : le choix
                  d'articles a besoin des images, des catégories et des extras,
                  impossibles à présenter correctement dans cet espace. */}
              <Button
                variant="secondary"
                icon="icon-[mdi--plus]"
                className="w-full"
                onClick={() => {
                  handleClose();
                  router.push(`/commandes/${order._id}/ajouter`);
                }}
              >
                Ajouter des articles
              </Button>
              {order.appliedPromo && (
                <p className="mt-2 text-xs text-foreground/45">
                  La remise de {order.appliedPromo.code} sera recalculée sur le
                  nouveau total des articles.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {order && (
        <>
          <DeliveryPersonModal
            isOpen={isDispatchOpen}
            onClose={() => setIsDispatchOpen(false)}
            store={order.store}
            onConfirm={handleDispatch}
            isSubmitting={isUpdatingStatus}
            title={`Envoyer la commande #${order.dailyNumber}`}
            confirmLabel="Envoyer en livraison"
          />

          <DeliveryPersonModal
            isOpen={isReassignOpen}
            onClose={() => setIsReassignOpen(false)}
            store={order.store}
            currentDeliveryPersonId={deliveryPerson?._id ?? null}
            onConfirm={handleReassign}
            isSubmitting={isSavingPerson}
            title="Changer de livreur"
            confirmLabel="Enregistrer"
          />

          <ConfirmDialog
            isOpen={isCancelConfirmOpen}
            onClose={() => setIsCancelConfirmOpen(false)}
            onConfirm={handleCancel}
            title={`Annuler la commande #${order.dailyNumber} ?`}
            description="Le client ne sera plus servi. Cette action est irréversible."
            confirmLabel="Annuler la commande"
            variant="danger"
            isLoading={isUpdatingStatus}
          />
          <ConfirmDialog
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onConfirm={handleDelete}
            title={`Supprimer la commande #${order.dailyNumber} ?`}
            description={
              order.status === "completed"
                ? `Cette vente de ${formatDA(order.totalPrice)} sera retirée du chiffre d'affaires et de l'historique, définitivement.`
                : "Suppression définitive, à réserver aux erreurs de saisie."
            }
            confirmLabel="Supprimer"
            variant="danger"
            isLoading={isDeleting}
          />
        </>
      )}
    </Modal>
  );
}
