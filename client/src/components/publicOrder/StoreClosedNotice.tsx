"use client";

import Link from "next/link";
import { useStoreStatuses } from "@/features/storeSettings/useStoreStatuses";
import { STORE_LABELS } from "@/types/store";

/**
 * Prévient le client qu'un restaurant ne prend plus de commandes.
 *
 * Placé en TÊTE de la carte, avant les plats : découvrir la fermeture au
 * moment d'envoyer, après avoir composé un panier de six articles, est la
 * pire façon de l'apprendre. Le blocage réel reste côté serveur (503) — ceci
 * n'est qu'une politesse, mais c'est elle qui fait la différence à l'usage.
 *
 * Ne rend rien tant que tout est ouvert : pas de bandeau permanent qui
 * apprendrait au client à ignorer cette zone de l'écran.
 */
export function StoreClosedNotice() {
  const { closed, allClosed } = useStoreStatuses();

  if (closed.length === 0) return null;

  // Tout est fermé : ton unique message est celui du premier magasin, sinon on
  // empilerait deux fois la même phrase.
  if (allClosed) {
    return (
      <div
        role="status"
        className="mb-5 flex flex-col items-center gap-2 rounded-2xl border border-accent-bordeaux/40 bg-accent-bordeaux/10 px-5 py-5 text-center backdrop-blur-sm"
      >
        <span
          aria-hidden="true"
          className="icon-[mdi--store-clock-outline] text-3xl text-accent-bordeaux"
        />
        <p className="font-heading text-base font-bold text-foreground">
          Commandes en ligne fermées
        </p>
        <p className="max-w-md text-sm text-foreground/70">
          {closed[0]?.closedMessage ??
            "Nos restaurants ne prennent plus de commandes en ligne pour le moment. Vous pouvez consulter la carte, et nous appeler si besoin."}
        </p>
        <Link
          href="/#contact"
          className="mt-1 text-sm font-bold text-accent-bordeaux underline"
        >
          Voir nos numéros
        </Link>
      </div>
    );
  }

  // Fermeture partielle : le client peut toujours commander ailleurs, donc ton
  // mustard plutôt que le bordeaux — c'est une information, pas un mur.
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-3 rounded-2xl border border-accent-mustard/40 bg-accent-mustard/10 px-4 py-3 backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="icon-[mdi--information-outline] mt-0.5 shrink-0 text-lg text-accent-mustard"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-heading text-sm font-bold text-foreground">
          {closed.map((status) => STORE_LABELS[status.store]).join(" et ")} ne
          prend
          {closed.length > 1 ? "nent" : ""} plus de commandes
        </p>
        <p className="text-sm text-foreground/75">
          {closed[0]?.closedMessage ??
            "Vous pouvez commander sur notre autre adresse."}
        </p>
      </div>
    </div>
  );
}
