"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ElapsedTimer } from "@/components/orders/ElapsedTimer";
import { useMarkDeliveredMutation } from "@/features/delivery/deliveryApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import type { Order, OrderItem } from "@/types/order";

/**
 * Une ligne d'article, en lecture seule.
 *
 * Le détail complet est là — extras, formule, retraits — parce que c'est le
 * livreur qui remet le sac : s'il doit vérifier qu'il ne manque rien, ou
 * répondre au client qui demande « c'est bien sans oignons ? », il lui faut la
 * commande telle qu'elle est sortie de cuisine.
 */
function DeliveryLine({ item }: { item: OrderItem }) {
  // Défensif comme partout ailleurs : d'anciennes commandes peuvent avoir ces
  // champs absents malgré le default du schéma, qui ne joue qu'à la création.
  const extras = item.selectedExtras ?? [];
  const excluded = item.excludedIngredients ?? [];
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const variantLabel = formatVariantLabel(item.variantSelected);

  return (
    <li className="flex gap-3 py-2">
      <span className="tabular-nums mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 px-1 text-xs font-bold text-primary">
        {item.quantity}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-heading text-sm font-bold text-foreground">
            {item.name}
          </p>
          <span className="tabular-nums shrink-0 text-sm font-semibold text-foreground/70">
            {formatDA((item.unitPrice + extrasTotal) * item.quantity)}
          </span>
        </div>

        {variantLabel !== "Standard" && (
          <p className="text-xs text-foreground/75">{variantLabel}</p>
        )}

        {item.formula && (
          <p className="text-xs font-semibold text-accent-mustard">
            {item.formula.name}
            {item.formula.includes.length > 0 &&
              ` : ${item.formula.includes.join(", ")}`}
          </p>
        )}

        {extras.length > 0 && (
          <p className="text-xs text-accent-green">
            + {extras.map((extra) => extra.name).join(", ")}
          </p>
        )}

        {excluded.length > 0 && (
          <p className="text-xs text-accent-bordeaux">
            sans {excluded.join(", ")}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Une course.
 *
 * Hiérarchie dictée par l'usage réel, pas par la structure des données : le
 * livreur cherche d'abord OÙ aller, puis COMBIEN encaisser, et seulement
 * ensuite ce qu'il y a dans le sac. Adresse et téléphone sont donc des boutons
 * pleine largeur en haut, pas des lignes de texte — il est sur un scooter, il
 * ne vise pas un lien de 14 pixels.
 */
export function DeliveryOrderCard({ order }: { order: Order }) {
  const [markDelivered, { isLoading }] = useMarkDeliveredMutation();
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const address = order.client.address ?? "";
  const phone = order.client.phone ?? "";
  const itemsTotal = order.totalPrice - (order.deliveryFee ?? 0);

  async function handleDelivered() {
    try {
      await markDelivered(order._id).unwrap();
      toast.success(`Commande #${order.dailyNumber} livrée`);
      setIsConfirmOpen(false);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de valider cette livraison"),
      );
    }
  }

  return (
    <>
      <article className="surface-card flex flex-col gap-4 p-4 sm:p-5">
        <header className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-bold leading-none text-foreground">
              #{order.dailyNumber}
            </span>
            <span className="truncate text-sm font-semibold text-foreground/70">
              {order.client.fullName}
            </span>
          </div>
          {/* Le minuteur passe en mustard puis en bordeaux au fil des minutes :
              c'est le seul repère de priorité quand plusieurs courses sont
              parties ensemble. */}
          <ElapsedTimer since={order.createdAt} />
        </header>

        {/* ---------- Où aller, qui appeler ---------- */}
        <div className="flex flex-col gap-2">
          {address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/20"
            >
              <span
                aria-hidden="true"
                className="icon-[mdi--map-marker] shrink-0 text-2xl text-primary"
              />
              <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                {address}
              </span>
              <span
                aria-hidden="true"
                className="icon-[mdi--directions] shrink-0 text-xl text-primary"
              />
            </a>
          )}

          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex min-h-14 items-center gap-3 rounded-xl bg-accent-green/10 px-4 py-3 transition-colors hover:bg-accent-green/20"
            >
              <span
                aria-hidden="true"
                className="icon-[mdi--phone] shrink-0 text-2xl text-accent-green"
              />
              <span className="tabular-nums flex-1 font-heading text-base font-bold text-foreground">
                {phone}
              </span>
              <span className="text-xs font-semibold text-accent-green">
                Appeler
              </span>
            </a>
          )}
        </div>

        {order.remark && (
          <p className="rounded-xl bg-accent-mustard/10 px-3 py-2 text-sm text-foreground/80">
            <span className="font-bold">Précision : </span>
            {order.remark}
          </p>
        )}

        {/* ---------- Le sac ---------- */}
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground/75 marker:content-none">
            <span
              aria-hidden="true"
              className="icon-[mdi--chevron-right] text-lg transition-transform group-open:rotate-90"
            />
            Détail de la commande
            <span className="tabular-nums text-xs text-foreground/40">
              ({order.items.length} ligne{order.items.length > 1 ? "s" : ""})
            </span>
          </summary>

          <ul className="mt-2 flex flex-col divide-y divide-dashed divide-border-subtle border-t border-dashed border-border-subtle pt-1">
            {order.items.map((item, index) => (
              <DeliveryLine key={index} item={item} />
            ))}
          </ul>
        </details>

        {/* ---------- Ce qu'il encaisse ---------- */}
        <div className="flex flex-col gap-1.5 border-t border-border-subtle pt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground/75">Articles</span>
            <span className="tabular-nums font-semibold text-foreground/80">
              {formatDA(itemsTotal)}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground/75">Livraison</span>
            <span className="tabular-nums font-semibold text-foreground/80">
              {/* deliveryFee est fixé par le staff : tant qu'il est absent,
                  afficher 0 DA ferait encaisser le mauvais montant. */}
              {order.deliveryFee !== undefined
                ? formatDA(order.deliveryFee)
                : "à confirmer"}
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-between border-t border-border-subtle pt-2.5">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
              À encaisser
            </span>
            <span className="tabular-nums font-heading text-2xl font-bold text-accent-green">
              {formatDA(order.totalPrice)}
            </span>
          </div>
        </div>

        {/* Passe par une confirmation : le geste est irréversible — la commande
            part à l'historique et compte dans le chiffre d'affaires — et un
            écran tactile dans une poche produit des clics involontaires. */}
        <Button
          size="lg"
          icon="icon-[mdi--check-circle-outline]"
          onClick={() => setIsConfirmOpen(true)}
          className="w-full"
        >
          Remis au client
        </Button>
      </article>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelivered}
        title={`Commande #${order.dailyNumber} remise ?`}
        description={`${formatDA(order.totalPrice)} encaissés auprès de ${order.client.fullName}. Cette course sera clôturée.`}
        confirmLabel="Oui, c'est remis"
        isLoading={isLoading}
      />
    </>
  );
}
