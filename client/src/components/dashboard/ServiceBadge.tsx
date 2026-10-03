"use client";

import { useState } from "react";
import { useGetCountersQuery, useResetCounterMutation } from "@/features/orders/orderApi";
import { useActiveStore } from "@/features/store/useActiveStore";
import { useToast } from "@/features/toast/useToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { STORE_LABELS } from "@/types/store";
import type { CounterState } from "@/types/order";

interface ApiError {
  data?: { error?: string };
  status?: number;
}

function formatStartedAt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Un seul badge, cliquable, par magasin réellement accessible :
// - employee : son magasin uniquement
// - admin sur un magasin précis : ce magasin
// - admin en vue "tous les magasins" : un badge compact par magasin, chacun
//   ouvrant son propre service (le backend exige un `store` explicite pour
//   un admin — pas de reset "des deux à la fois" possible)
export function ServiceBadge() {
  const { activeStore } = useActiveStore();
  const { data: counters } = useGetCountersQuery({ store: activeStore });

  if (!counters || counters.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {counters.map((counter) => (
        <SingleServiceBadge key={counter.store} counter={counter} />
      ))}
    </div>
  );
}

function SingleServiceBadge({ counter }: { counter: CounterState }) {
  const [resetCounter, { isLoading }] = useResetCounterMutation();
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const startedLabel = formatStartedAt(counter.lastResetAt);

  async function handleReset() {
    try {
      await resetCounter({ store: counter.store }).unwrap();
      toast.success(`Nouveau service ouvert — ${STORE_LABELS[counter.store]}`);
      setIsConfirmOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      // 409 : des commandes sont encore en cours — le message backend est déjà clair
      toast.error(
        apiError.data?.error ?? "Impossible d'ouvrir un nouveau service",
      );
    }
  }

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:border-primary"
        title={`Ouvrir un nouveau service — ${STORE_LABELS[counter.store]}`}
      >
        <span className="icon-[mdi--timer-outline] text-base text-accent-green" />
        <span className="hidden sm:inline">{STORE_LABELS[counter.store]} · </span>
        {startedLabel ? `depuis ${startedLabel}` : "Aucun service"}
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
          #{counter.value}
        </span>
      </button>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleReset}
        title="Ouvrir un nouveau service ?"
        description={`La numérotation des commandes de ${STORE_LABELS[counter.store]} repartira de 1. Bloqué s'il reste des commandes en cours.`}
        confirmLabel="Ouvrir le service"
        isLoading={isLoading}
      />
    </>
  );
}
