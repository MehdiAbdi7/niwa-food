"use client";

import { Switch } from "@/components/ui/Switch";
import { formatDA } from "@/lib/format";
import { ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { useUpdatePromoCodeMutation } from "@/features/promo/promoApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import type { PromoCode } from "@/types/promoCode";

/**
 * Résumé lisible des contraintes d'un code.
 *
 * Une phrase par contrainte RÉELLEMENT posée : lister « pas de plafond, pas de
 * date de fin, usages illimités » remplirait la ligne de non-informations.
 * Un code sans aucune contrainte n'affiche donc rien, et c'est en soi un
 * signal — celui-là tourne sans limite.
 */
function describeConstraints(promo: PromoCode): string[] {
  const parts: string[] = [];

  if (promo.maxDiscountAmount) {
    parts.push(`plafonné à ${formatDA(promo.maxDiscountAmount)}`);
  }

  if (promo.minOrderAmount) {
    parts.push(`dès ${formatDA(promo.minOrderAmount)} d'articles`);
  }

  if (promo.orderTypes.length > 0) {
    parts.push(
      promo.orderTypes
        .map((type) => ORDER_TYPE_LABELS[type].toLowerCase())
        .join(" / "),
    );
  }

  if (promo.maxUses) {
    parts.push(`${promo.usedCount}/${promo.maxUses} utilisations`);
  } else if (promo.usedCount > 0) {
    parts.push(`${promo.usedCount} utilisation${promo.usedCount > 1 ? "s" : ""}`);
  }

  return parts;
}

/**
 * Fenêtre de validité, en clair.
 *
 * timeZone UTC volontairement ABSENT ici, contrairement à formatServiceDate :
 * `startsAt` et `endsAt` sont des instants réels choisis par l'admin, pas des
 * journées commerciales normalisées à minuit UTC. Les afficher dans le fuseau
 * du lecteur est exactement ce qu'on veut.
 */
function formatWindow(promo: PromoCode): string | null {
  const format = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  if (promo.startsAt && promo.endsAt) {
    return `du ${format(promo.startsAt)} au ${format(promo.endsAt)}`;
  }
  if (promo.endsAt) return `jusqu'au ${format(promo.endsAt)}`;
  if (promo.startsAt) return `à partir du ${format(promo.startsAt)}`;
  return null;
}

/**
 * État réel du code, dates comprises.
 *
 * `active` seul ne suffit pas : un code activé mais expiré est refusé par le
 * backend, et l'afficher « actif » dans le dashboard ferait chercher la panne
 * ailleurs pendant un quart d'heure.
 */
type EffectiveState = "active" | "scheduled" | "expired" | "exhausted" | "off";

function getEffectiveState(promo: PromoCode): EffectiveState {
  if (!promo.active) return "off";

  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) {
    return "scheduled";
  }
  if (promo.endsAt && new Date(promo.endsAt).getTime() <= now) {
    return "expired";
  }
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return "exhausted";

  return "active";
}

const STATE_BADGES: Record<
  EffectiveState,
  { label: string; className: string }
> = {
  active: {
    label: "En cours",
    className: "bg-accent-green/15 text-accent-green",
  },
  scheduled: {
    label: "Programmé",
    className: "bg-accent-mustard/15 text-accent-mustard",
  },
  expired: {
    label: "Expiré",
    className: "bg-foreground/10 text-foreground/75",
  },
  exhausted: {
    label: "Épuisé",
    className: "bg-accent-bordeaux/15 text-accent-bordeaux",
  },
  off: { label: "Désactivé", className: "bg-foreground/10 text-foreground/75" },
};

interface PromoCodeCardProps {
  promo: PromoCode;
  onEdit: () => void;
  onDelete: () => void;
}

export function PromoCodeCard({ promo, onEdit, onDelete }: PromoCodeCardProps) {
  const [updatePromo, { isLoading }] = useUpdatePromoCodeMutation();
  const toast = useToast();

  const state = getEffectiveState(promo);
  const badge = STATE_BADGES[state];
  const constraints = describeConstraints(promo);
  const window = formatWindow(promo);

  async function toggleActive(next: boolean) {
    if (isLoading) return;

    try {
      await updatePromo({ id: promo._id, body: { active: next } }).unwrap();
      toast.success(
        next ? `${promo.code} réactivé` : `${promo.code} désactivé`,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de modifier ce code"));
    }
  }

  return (
    <div
      // Mobile : identité sur une ligne, actions sur la suivante.
      // sm+ : tout revient sur une seule ligne, comme la page Équipe.
      className={`flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 transition-opacity sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
        state === "active" ? "" : "opacity-70"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-heading text-sm font-bold text-primary">
          −{promo.discountPercent}%
        </div>

        {/* min-w-0 casse le min-width:auto du flex item : sans lui, une longue
            liste de contraintes pousse les actions hors de l'écran. */}
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-heading font-bold uppercase tracking-wider text-foreground">
            {promo.code}
          </span>

          {promo.description && (
            <span className="truncate text-xs text-foreground/75">
              {promo.description}
            </span>
          )}

          {(constraints.length > 0 || window) && (
            <span className="truncate text-xs text-foreground/45">
              {[...constraints, window].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badge.className}`}
        >
          {badge.label}
        </span>

        {/* L'interrupteur AVANT la corbeille, et c'est délibéré : couper un
            code est le geste courant, le supprimer est l'exception. Le
            désactiver conserve en plus la trace de ce qu'il a généré. */}
        <Switch checked={promo.active} onChange={toggleActive} />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Modifier ${promo.code}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/75 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <span aria-hidden="true" className="icon-[mdi--pencil-outline] text-base" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Supprimer ${promo.code}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/75 transition-colors hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux"
          >
            <span
              aria-hidden="true"
              className="icon-[mdi--trash-can-outline] text-base"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
