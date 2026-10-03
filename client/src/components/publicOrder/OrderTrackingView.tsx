"use client";

import Link from "next/link";
import { useOrderTracking } from "@/features/publicOrder/useOrderTracking";
import { formatDA, formatTime } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import { ORDER_TYPE_ICONS, ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { STORE_LABELS } from "@/types/store";
import type { OrderItem, OrderStatus, OrderType } from "@/types/order";

interface Step {
  status: OrderStatus;
  label: string;
  hint: string;
  icon: string;
}

/**
 * Le parcours affiché au client, par mode de service.
 *
 * DEUX PIÈGES à garder en tête en modifiant ces listes.
 *
 * 1. Il n'existe PAS de statut « en préparation » distinct. `pending` couvre
 *    à la fois « la commande est arrivée » et « la cuisine est dessus », parce
 *    qu'un statut de plus, c'est un clic de plus par commande en plein coup de
 *    feu. Le libellé de `pending` doit donc porter les deux idées — et surtout
 *    PAS celui de `ready`, qui signifie que le plat est terminé. C'est
 *    exactement l'erreur qui traînait sur dine_in : un client voyait
 *    « en préparation » alors que son burger l'attendait au passe.
 *
 * 2. La suite d'étapes dépend du mode : une commande à emporter ne passe
 *    jamais par « en livraison », afficher l'étape grisée laisserait croire à
 *    une attente supplémentaire.
 */
const STEPS_BY_TYPE: Record<OrderType, Step[]> = {
  dine_in: [
    {
      status: "pending",
      label: "Commande reçue",
      hint: "C'est en préparation.",
      icon: "icon-[mdi--chef-hat]",
    },
    {
      status: "ready",
      label: "Prête",
      hint: "On vous l'apporte à table.",
      icon: "icon-[mdi--room-service-outline]",
    },
    {
      status: "completed",
      label: "Servie",
      hint: "Bon appétit !",
      icon: "icon-[mdi--silverware-fork-knife]",
    },
  ],
  takeaway: [
    {
      status: "pending",
      label: "Commande reçue",
      hint: "C'est en préparation.",
      icon: "icon-[mdi--chef-hat]",
    },
    {
      status: "ready",
      label: "Prête à récupérer",
      hint: "Présentez-vous au comptoir.",
      icon: "icon-[mdi--bag-checked]",
    },
    {
      status: "completed",
      label: "Récupérée",
      hint: "Bon appétit !",
      icon: "icon-[mdi--check-all]",
    },
  ],
  delivery: [
    {
      status: "pending",
      label: "Commande reçue",
      hint: "C'est en préparation.",
      icon: "icon-[mdi--chef-hat]",
    },
    {
      status: "ready",
      label: "Prête",
      hint: "Elle part bientôt.",
      icon: "icon-[mdi--package-variant-closed]",
    },
    {
      status: "out_for_delivery",
      label: "En route",
      hint: "Le livreur est parti.",
      icon: "icon-[mdi--moped]",
    },
    {
      status: "completed",
      label: "Livrée",
      hint: "Bon appétit !",
      icon: "icon-[mdi--check-all]",
    },
  ],
};

function OrderLine({ item }: { item: OrderItem }) {
  // Défensif comme partout ailleurs : d'anciennes commandes peuvent avoir ces
  // champs absents malgré le default du schéma, qui ne joue qu'à la création.
  const extras = item.selectedExtras ?? [];
  const excluded = item.excludedIngredients ?? [];
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const variantLabel = formatVariantLabel(item.variantSelected);

  return (
    <li className="flex gap-3 py-3">
      <span className="tabular-nums mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 px-1 text-xs font-bold text-primary">
        {item.quantity}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-heading text-sm font-bold text-foreground">
            {item.name}
          </p>
          <span className="tabular-nums shrink-0 font-heading text-sm font-bold text-foreground">
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

        {item.quantity > 1 && (
          <p className="tabular-nums text-xs text-foreground/40">
            {formatDA(item.unitPrice + extrasTotal)} l&apos;unité
          </p>
        )}
      </div>
    </li>
  );
}

export function OrderTrackingView({ orderId }: { orderId: string }) {
  const { order, isLoading, isError, refetch, isLive } =
    useOrderTracking(orderId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="icon-[mdi--loading] animate-spin text-4xl text-primary" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="icon-[mdi--receipt-text-remove-outline] text-5xl text-foreground/25" />
        <h1 className="font-heading text-xl font-bold text-foreground">
          Commande introuvable
        </h1>
        <p className="text-sm text-foreground/75">
          Elle a peut-être été supprimée, ou le lien est incomplet.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 rounded-full border border-primary px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          Réessayer
        </button>
        {/* Deux sorties : reprendre une commande, ou retrouver la sienne par
            son numéro si c'est le lien qui est cassé. */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/commande"
            className="text-sm font-semibold text-accent-green"
          >
            Retour à la carte
          </Link>
          <Link
            href="/commande/suivi"
            className="text-sm font-semibold text-primary underline"
          >
            Chercher par numéro
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const steps = STEPS_BY_TYPE[order.type];
  const currentIndex = steps.findIndex((step) => step.status === order.status);
  const currentStep = steps[Math.max(0, currentIndex)];

  // `?? 0` obligatoire : les commandes antérieures au code promo n'ont pas ce
  // champ, et `undefined` dans une soustraction donne NaN — donc un total
  // affiché « NaN DA » sur d'anciennes commandes encore en cours.
  const discountAmount = order.discountAmount ?? 0;

  // Reconstitué à l'envers depuis le total, et non recalculé depuis les items :
  // totalPrice fait foi, c'est lui qui a été encaissé. Repartir des lignes
  // rouvrirait la porte à un écart d'arrondi entre l'écran et la caisse.
  const itemsTotal = order.totalPrice + discountAmount - (order.deliveryFee ?? 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-28">
      {/* ---------- En-tête ---------- */}
      <header className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wide text-accent-green">
          <span className={`${ORDER_TYPE_ICONS[order.type]} text-base`} />
          {ORDER_TYPE_LABELS[order.type]} · {STORE_LABELS[order.store]}
        </span>

        <div className="flex items-baseline gap-2">
          <span className="font-heading text-sm font-bold text-foreground/75">
            Commande
          </span>
          <span className="tabular-nums font-heading text-5xl font-bold leading-none text-primary">
            #{order.dailyNumber}
          </span>
        </div>

        <p className="text-sm text-foreground/75">
          {order.client.fullName} · passée à {formatTime(order.createdAt)}
        </p>

        {/* Le client doit savoir s'il regarde du direct ou une page qui se
            rafraîchit toutes les douze secondes. */}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground/45">
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? "bg-accent-green" : "bg-foreground/30"
            }`}
          />
          {isLive ? "Suivi en direct" : "Actualisation automatique"}
        </span>
      </header>

      {isCancelled ? (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-3xl border border-accent-bordeaux/40 bg-accent-bordeaux/10 px-6 py-8 text-center">
          <span className="icon-[mdi--close-circle-outline] text-4xl text-accent-bordeaux" />
          <p className="font-heading text-lg font-bold text-foreground">
            Commande annulée
          </p>
          <p className="max-w-xs text-sm text-foreground/75">
            Contactez le restaurant si vous pensez qu&apos;il s&apos;agit
            d&apos;une erreur.
          </p>
          <Link
            href="/contact"
            className="mt-1 text-sm font-bold text-accent-bordeaux underline"
          >
            Voir nos numéros
          </Link>
        </div>
      ) : (
        <div className="mb-6 flex flex-col items-center gap-1.5 rounded-3xl border border-primary/25 bg-primary/5 px-6 py-6 text-center">
          <span className={`${currentStep.icon} text-4xl text-primary`} />
          <p className="font-heading text-xl font-bold text-foreground">
            {currentStep.label}
          </p>
          <p className="text-sm text-foreground/75">{currentStep.hint}</p>
        </div>
      )}

      {/* ---------- Détail chiffré ---------- */}
      <section className="ticket-notch relative mb-6 flex flex-col rounded-3xl border border-primary/25 bg-background pb-6 dark:bg-primary/10">
        <header className="border-b border-dashed border-primary/25 px-5 py-4">
          <h2 className="font-heading text-base font-bold text-foreground">
            Le détail
          </h2>
        </header>

        <ul className="flex flex-col divide-y divide-dashed divide-primary/20 px-5">
          {order.items.map((item, index) => (
            <OrderLine key={index} item={item} />
          ))}
        </ul>

        {order.remark && (
          <p className="mx-5 mt-3 rounded-xl bg-accent-mustard/10 px-3 py-2 text-xs text-foreground/75">
            <span className="font-bold">Votre précision : </span>
            {order.remark}
          </p>
        )}

        <div className="mt-2 flex flex-col gap-1.5 border-t border-dashed border-primary/25 px-5 pt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground/75">Articles</span>
            <span className="tabular-nums font-semibold text-foreground/80">
              {formatDA(itemsTotal)}
            </span>
          </div>

          {/* Le code est nommé, pas seulement le montant : un « −250 DA » sans
              étiquette ressemble à une erreur de caisse, ce qui est exactement
              l'inverse de l'effet recherché par une promotion. */}
          {discountAmount > 0 && (
            <div className="flex items-baseline justify-between text-sm">
              <span className="flex items-center gap-1.5 text-accent-green">
                <span
                  aria-hidden="true"
                  className="icon-[mdi--ticket-percent-outline] text-base"
                />
                {order.appliedPromo?.code ?? "Remise"}
                {order.appliedPromo &&
                  ` · −${order.appliedPromo.discountPercent}%`}
              </span>
              <span className="tabular-nums font-bold text-accent-green">
                −{formatDA(discountAmount)}
              </span>
            </div>
          )}

          {order.type === "delivery" && (
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-foreground/75">Livraison</span>
              <span className="tabular-nums font-semibold text-foreground/80">
                {/* deliveryFee est fixé par le staff après réception : tant
                    qu'il est absent, annoncer 0 DA serait un mensonge. */}
                {order.deliveryFee !== undefined
                  ? formatDA(order.deliveryFee)
                  : "à confirmer"}
              </span>
            </div>
          )}

          <div className="mt-1 flex items-baseline justify-between border-t border-primary/20 pt-3">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
              Total
            </span>
            <span className="tabular-nums font-heading text-2xl font-bold text-accent-green">
              {formatDA(order.totalPrice)}
            </span>
          </div>
        </div>
      </section>

      {/* ---------- Suivi, en bas ---------- */}
      {!isCancelled && (
        <section className="flex flex-col gap-1">
          <h2 className="mb-2 font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
            Où en est votre commande
          </h2>

          {steps.map((step, index) => {
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.status} className="flex gap-3">
                {/* Colonne pastille + trait de liaison */}
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isDone
                        ? "border-accent-green bg-accent-green text-on-primary"
                        : isCurrent
                          ? "border-primary bg-primary text-on-primary"
                          : "border-primary/25 text-foreground/30"
                    }`}
                  >
                    <span
                      className={`${isDone ? "icon-[mdi--check]" : step.icon} text-lg`}
                    />
                  </span>

                  {!isLast && (
                    <span
                      className={`w-0.5 flex-1 ${
                        isDone ? "bg-accent-green" : "bg-primary/20"
                      }`}
                    />
                  )}
                </div>

                <div className={`flex flex-col ${isLast ? "pb-0" : "pb-5"}`}>
                  <p
                    className={`font-heading text-sm font-bold ${
                      isCurrent ? "text-foreground" : "text-foreground/75"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-foreground/45">
                    {isCurrent || isDone ? step.hint : "En attente"}
                  </p>
                  {isLast && order.completedAt && (
                    <p className="tabular-nums text-xs text-accent-green">
                      {formatTime(order.completedAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <div className="mt-8 flex flex-col items-center gap-2">
        <Link
          href="/commande"
          className="rounded-full border border-primary px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
        >
          Commander autre chose
        </Link>
        <p className="text-xs text-foreground/40">
          Gardez cette page ouverte, elle se met à jour toute seule.
        </p>
      </div>
    </div>
  );
}
