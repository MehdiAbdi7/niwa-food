"use client";

import { useState } from "react";
import { PromoCodeCard } from "@/components/promo/PromoCodeCard";
import { PromoCodeFormModal } from "@/components/promo/PromoCodeFormModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetPromoCodesQuery,
  useDeletePromoCodeMutation,
} from "@/features/promo/promoApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import type { PromoCode } from "@/types/promoCode";

/**
 * Codes promo.
 *
 * La restriction admin vit dans le layout voisin, donc côté serveur : le HTML
 * de cette page n'est jamais envoyé à un employé.
 */
export default function PromotionsPage() {
  const { data: promos, isLoading, isError } = useGetPromoCodesQuery();
  const [deletePromo, { isLoading: isDeleting }] = useDeletePromoCodeMutation();
  const toast = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);

  async function handleDelete() {
    if (!deletingPromo) return;

    try {
      await deletePromo(deletingPromo._id).unwrap();
      toast.success("Code promo supprimé");
      setDeletingPromo(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de supprimer ce code"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Impossible de charger les codes promo"
        description="Vérifie ta connexion, puis recharge la page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Commercial"
        title="Codes promo"
        description="Crée des remises que tes clients saisissent au moment de valider leur commande."
        action={
          <Button
            icon="icon-[mdi--ticket-percent-outline]"
            onClick={() => setIsCreating(true)}
          >
            Nouveau code
          </Button>
        }
      />

      {!promos || promos.length === 0 ? (
        <EmptyState
          icon="icon-[mdi--ticket-percent-outline]"
          title="Aucun code promo"
          description="Crée ton premier code : il s'appliquera aux deux restaurants, et le client le saisira au moment de finaliser sa commande."
          action={
            <Button
              icon="icon-[mdi--plus]"
              onClick={() => setIsCreating(true)}
            >
              Créer un code
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {promos.map((promo) => (
            <PromoCodeCard
              key={promo._id}
              promo={promo}
              onEdit={() => setEditingPromo(promo)}
              onDelete={() => setDeletingPromo(promo)}
            />
          ))}
        </div>
      )}

      {/* Deux règles qui ne se devinent pas depuis l'interface, et sur
          lesquelles on se fait rattraper une fois chacune. */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-2/60 px-4 py-3 text-xs leading-relaxed text-foreground/75">
        <p className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="icon-[mdi--information-outline] mt-0.5 shrink-0 text-sm text-primary"
          />
          La remise porte sur les articles uniquement : les frais de livraison
          ne sont jamais réduits.
        </p>
        <p className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="icon-[mdi--information-outline] mt-0.5 shrink-0 text-sm text-primary"
          />
          Modifier un code ne change RIEN aux commandes déjà passées : chacune
          conserve le pourcentage qui lui a été appliqué.
        </p>
      </div>

      <PromoCodeFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        promo={null}
      />
      <PromoCodeFormModal
        isOpen={editingPromo !== null}
        onClose={() => setEditingPromo(null)}
        promo={editingPromo}
      />
      <ConfirmDialog
        isOpen={deletingPromo !== null}
        onClose={() => setDeletingPromo(null)}
        onConfirm={handleDelete}
        title={`Supprimer le code ${deletingPromo?.code} ?`}
        description={
          deletingPromo && deletingPromo.usedCount > 0
            ? `Ce code a servi ${deletingPromo.usedCount} fois. Les commandes concernées gardent leur remise, mais tu ne pourras plus les retrouver par ce code dans l'historique. Le désactiver serait plus prudent.`
            : "Cette action est irréversible."
        }
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
