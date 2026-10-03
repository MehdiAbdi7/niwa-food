"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useGetCountersQuery, useResetCounterMutation } from "@/features/orders/orderApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatTime } from "@/lib/format";
import { STORE_LABELS, type Store } from "@/types/store";

export function ServiceManagementCard() {
  const { isAdmin } = useAuth();
  const { data: counters } = useGetCountersQuery();
  const [resetCounter, { isLoading }] = useResetCounterMutation();
  const toast = useToast();

  const [targetStore, setTargetStore] = useState<Store | null>(null);
  const [force, setForce] = useState(false);

  function closeDialog() {
    setTargetStore(null);
    setForce(false);
  }

  async function handleReset() {
    if (!targetStore) return;
    try {
      await resetCounter({ store: targetStore, force: isAdmin ? force : undefined }).unwrap();
      toast.success(`Nouveau service ouvert — ${STORE_LABELS[targetStore]}`);
      closeDialog();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible d'ouvrir un nouveau service"));
    }
  }

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <h2 className="font-heading text-base font-bold text-foreground">Service</h2>
      <p className="text-sm text-foreground/75">
        Ouvrir un nouveau service remet la numérotation des commandes à zéro pour
        le magasin choisi, et rouvre les commandes en ligne. Bloqué s&apos;il
        reste des commandes en cours.
      </p>

      <div className="flex flex-col gap-2">
        {(counters ?? []).map((counter) => (
          <div
            key={counter.store}
            className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {STORE_LABELS[counter.store]}
              </span>
              <span className="text-xs text-foreground/75">
                {counter.lastResetAt
                  ? `Service depuis ${formatTime(counter.lastResetAt)} · #${counter.value}`
                  : "Aucun service ouvert"}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTargetStore(counter.store)}>
              Nouveau service
            </Button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={targetStore !== null}
        onClose={closeDialog}
        title={`Ouvrir un nouveau service — ${targetStore ? STORE_LABELS[targetStore] : ""}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleReset} isLoading={isLoading}>
              Ouvrir le service
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground/80">
            La numérotation des commandes repartira de 1, et les commandes en
            ligne seront rouvertes si elles étaient fermées. Cette action est
            bloquée s&apos;il reste des commandes en cours, sauf si tu la forces.
          </p>
          {isAdmin && (
            <Switch
              checked={force}
              onChange={setForce}
              label="Forcer même si des commandes sont en cours"
            />
          )}
        </div>
      </Modal>
    </section>
  );
}
