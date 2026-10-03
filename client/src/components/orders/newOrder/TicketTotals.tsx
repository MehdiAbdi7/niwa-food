"use client";

import { formatDA } from "@/lib/format";

interface TicketTotalsProps {
  itemsTotal: number;
  itemsCount: number;
  // Frais de livraison, seulement pour une commande de type delivery. Ils sont
  // fixés depuis la fiche commande une fois l'adresse connue, donc souvent
  // absents au moment de la saisie.
  deliveryFee?: number;
  /**
   * Remise appliquée, ou null.
   *
   * Le code est affiché à côté du montant : une ligne « −250 DA » sans
   * étiquette ressemble à une erreur de saisie, et c'est l'employé au comptoir
   * qui devra l'expliquer au client.
   */
  discount?: { code: string; percent: number; amount: number } | null;
}

/**
 * Récapitulatif chiffré du ticket : articles, remise, frais, total.
 *
 * L'ORDRE DES LIGNES REFLÈTE LE CALCUL DU BACKEND, et ce n'est pas cosmétique :
 * la remise s'applique aux articles SEULS, les frais de livraison sont ajoutés
 * après. Intervertir les deux lignes ici laisserait croire que la livraison est
 * remisée elle aussi.
 *
 * Le visuel de référence affiche aussi un choix de moyen de paiement. Il
 * n'existe pas dans le modèle Order du backend — l'afficher donnerait un
 * contrôle décoratif, sans effet sur la commande enregistrée.
 */
export function TicketTotals({
  itemsTotal,
  itemsCount,
  deliveryFee,
  discount = null,
}: TicketTotalsProps) {
  const discountAmount = discount?.amount ?? 0;
  const total = Math.max(0, itemsTotal - discountAmount) + (deliveryFee ?? 0);

  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-border-subtle pt-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground/75">
          Articles
          <span className="tabular-nums ml-1.5 text-foreground/40">
            ({itemsCount})
          </span>
        </span>
        <span className="tabular-nums font-semibold text-foreground/80">
          {formatDA(itemsTotal)}
        </span>
      </div>

      {discountAmount > 0 && discount && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-accent-green">
            <span
              aria-hidden="true"
              className="icon-[mdi--ticket-percent-outline] shrink-0 text-base"
            />
            <span className="truncate">
              {discount.code} · −{discount.percent}%
            </span>
          </span>
          <span className="tabular-nums shrink-0 font-bold text-accent-green">
            −{formatDA(discountAmount)}
          </span>
        </div>
      )}

      {deliveryFee !== undefined && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-foreground/75">Livraison</span>
          <span className="tabular-nums font-semibold text-foreground/80">
            {formatDA(deliveryFee)}
          </span>
        </div>
      )}

      <div className="mt-1 flex items-baseline justify-between border-t border-border-subtle pt-3">
        <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
          Total
        </span>
        <span className="tabular-nums font-heading text-2xl font-bold text-accent-green">
          {formatDA(total)}
        </span>
      </div>
    </div>
  );
}
