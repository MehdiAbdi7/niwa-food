"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useGetStoreStatusesQuery,
  useUpdateStoreStatusMutation,
} from "@/features/storeSettings/storeStatusApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { STORE_LABELS } from "@/types/store";
import type { StoreStatus } from "@/types/storeStatus";

/**
 * Une ligne par magasin. Composant à part et non un bloc dans la boucle : le
 * brouillon du message doit être local à chaque magasin, sinon fermer Kouba
 * écrirait dans le champ de Chéraga.
 *
 * L'état initial vient d'un initialiseur paresseux, pas d'un useEffect de
 * synchronisation : le parent ne monte ces lignes qu'une fois les données
 * chargées, donc la valeur lue est déjà la bonne.
 */
function StoreIntakeRow({ status }: { status: StoreStatus }) {
  const [updateStatus, { isLoading }] = useUpdateStoreStatusMutation();
  const toast = useToast();

  const [message, setMessage] = useState(() => status.closedMessage ?? "");

  async function apply(acceptingOrders: boolean) {
    try {
      await updateStatus({
        store: status.store,
        acceptingOrders,
        // À la réouverture on efface le message : « Fermé pour panne de four »
        // n'a plus de sens le lendemain, et resterait sinon collé à la
        // prochaine fermeture.
        closedMessage: acceptingOrders ? null : message.trim() || null,
      }).unwrap();

      toast.success(
        acceptingOrders
          ? `Commandes rouvertes — ${STORE_LABELS[status.store]}`
          : `Commandes fermées — ${STORE_LABELS[status.store]}`,
      );

      if (acceptingOrders) setMessage("");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier l'état des commandes"),
      );
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="font-semibold text-foreground">
            {STORE_LABELS[status.store]}
          </span>
          <span
            className={`text-xs font-semibold ${
              status.acceptingOrders
                ? "text-accent-green"
                : "text-accent-bordeaux"
            }`}
          >
            {status.acceptingOrders
              ? "Les clients peuvent commander"
              : "Commandes en ligne fermées"}
          </span>
        </div>

        {/* Le Switch ne s'auto-désactive pas pendant la requête : on s'appuie
            sur l'invalidation du tag, qui remet l'état réel du serveur. */}
        <Switch
          checked={status.acceptingOrders}
          onChange={(next) => {
            if (isLoading) return;
            apply(next);
          }}
        />
      </div>

      {/* Le champ n'apparaît qu'une fois fermé : proposer d'écrire un message
          de fermeture à un magasin ouvert n'a aucun sens. */}
      {!status.acceptingOrders && (
        <div className="flex items-end gap-2">
          <Input
            id={`closed-message-${status.store}`}
            label="Message affiché aux clients"
            placeholder="Ex : Fermé, on rouvre demain à 11h"
            maxLength={140}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => apply(false)}
            isLoading={isLoading}
          >
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Interrupteur des commandes en ligne, magasin par magasin.
 *
 * Distinct de ServiceManagementCard, qui gère la NUMÉROTATION : fermer les
 * commandes ne clôture pas le service, et les commandes déjà passées restent
 * préparables et encaissables. Seule la porte d'entrée client se verrouille —
 * le staff continue de saisir au comptoir et au téléphone.
 *
 * Accessible aux employés : c'est le poste en salle qui coupe en cas de rush
 * ou de rupture, pas l'admin depuis chez lui. Le backend impose de toute façon
 * son magasin à un employee (voir resolveTargetStore).
 */
export function OrderIntakeCard() {
  const { isAdmin, user } = useAuth();
  const { data: statuses, isLoading, isError } = useGetStoreStatusesQuery();

  // Un employee ne voit que son magasin : lui montrer un interrupteur qu'il ne
  // peut pas actionner serait une promesse en l'air.
  const visibleStatuses = (statuses ?? []).filter(
    (status) => isAdmin || status.store === user?.store,
  );

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-bold text-foreground">
          Commandes en ligne
        </h2>
        <p className="text-sm text-foreground/75">
          Coupe la prise de commande côté clients (QR code et site). Les
          commandes en cours restent traitables, et vous pouvez continuer à
          saisir au comptoir. Ouvrir un nouveau service les rouvre
          automatiquement.
        </p>
      </div>

      {isLoading && <Skeleton className="h-20 w-full rounded-xl" />}

      {isError && (
        <p className="rounded-xl bg-accent-bordeaux/10 px-3 py-2 text-sm text-accent-bordeaux">
          Impossible de charger l&apos;état des magasins.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-2">
          {visibleStatuses.map((status) => (
            <StoreIntakeRow key={status.store} status={status} />
          ))}
        </div>
      )}
    </section>
  );
}
