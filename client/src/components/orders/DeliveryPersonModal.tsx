"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetDeliveryPersonsQuery } from "@/features/auth/authApi";
import type { Store } from "@/types/store";

interface DeliveryPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Magasin de la commande : un livreur d'ailleurs serait refusé par l'API. */
  store: Store;
  /** Identifiant déjà assigné, pour préselectionner en cas de correction. */
  currentDeliveryPersonId?: string | null;
  /** `null` = « personne », le staff s'en charge. */
  onConfirm: (deliveryPersonId: string | null) => void;
  isSubmitting?: boolean;
  title: string;
  confirmLabel: string;
}

/**
 * Choix du livreur, au moment d'envoyer la commande en livraison.
 *
 * L'option « Sans livreur » est PREMIÈRE et toujours disponible : c'est le cas
 * du patron qui livre lui-même, ou d'un soir sans livreur enregistré. Le
 * backend n'exige pas l'assignation, et l'interface ne doit pas être plus
 * stricte que lui — une contrainte technique ne doit jamais bloquer le service.
 */
export function DeliveryPersonModal({
  isOpen,
  onClose,
  store,
  currentDeliveryPersonId = null,
  onConfirm,
  isSubmitting = false,
  title,
  confirmLabel,
}: DeliveryPersonModalProps) {
  const { data: persons, isLoading } = useGetDeliveryPersonsQuery(undefined, {
    // Inutile d'aller chercher la liste tant que la modale est fermée : ce
    // serait un appel de plus à chaque ouverture d'une fiche commande.
    skip: !isOpen,
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    currentDeliveryPersonId,
  );

  // Un admin en vue « tous les magasins » reçoit les livreurs des deux : on
  // écarte ici ceux qui ne peuvent pas porter CETTE course, plutôt que de
  // laisser le backend refuser après coup.
  const available = (persons ?? []).filter((person) => person.store === store);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            icon="icon-[mdi--moped-outline]"
            onClick={() => onConfirm(selectedId)}
            isLoading={isSubmitting}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground/75">
          Qui prend cette course ? Vous pourrez corriger ensuite depuis cette
          même fiche.
        </p>

        <button
          type="button"
          onClick={() => setSelectedId(null)}
          aria-pressed={selectedId === null}
          className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
            selectedId === null
              ? "border-primary bg-primary/10"
              : "border-border-subtle hover:border-primary/50"
          }`}
        >
          <span
            aria-hidden="true"
            className="icon-[mdi--account-off-outline] shrink-0 text-xl text-foreground/75"
          />
          <span className="flex min-w-0 flex-col">
            <span className="font-semibold text-foreground">Sans livreur</span>
            <span className="text-xs text-foreground/75">
              Vous validerez la livraison depuis le dashboard
            </span>
          </span>
        </button>

        {isLoading && <Skeleton className="h-14 w-full rounded-xl" />}

        {!isLoading &&
          available.map((person) => (
            <button
              key={person._id}
              type="button"
              onClick={() => setSelectedId(person._id)}
              aria-pressed={selectedId === person._id}
              className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                selectedId === person._id
                  ? "border-primary bg-primary/10"
                  : "border-border-subtle hover:border-primary/50"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-xs font-bold uppercase text-primary">
                {person.firstname[0]}
                {person.lastname[0]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-foreground">
                  {person.firstname} {person.lastname}
                </span>
                <span className="tabular-nums text-xs text-foreground/75">
                  {person.tel}
                </span>
              </span>
            </button>
          ))}

        {!isLoading && available.length === 0 && (
          <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-foreground/75">
            Aucun compte livreur sur ce magasin. Envoyez sans livreur, ou
            demandez à un admin d&apos;en créer un.
          </p>
        )}
      </div>
    </Modal>
  );
}
