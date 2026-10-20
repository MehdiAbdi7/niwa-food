"use client";

import Link from "next/link";
import { useStoreStatuses } from "@/features/storeSettings/useStoreStatuses";
import { useI18n } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/config";
import { pluralize } from "@/i18n/text";

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
 *
 * Le message de fermeture saisi par le restaurant (closedMessage) reste
 * dans la langue où il a été écrit : seul le message par défaut est traduit.
 */
export function StoreClosedNotice() {
  const { closed, allClosed } = useStoreStatuses();
  const { locale, dict } = useI18n();
  const texts = dict.storeClosed;

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
          {texts.allTitle}
        </p>
        <p className="max-w-md text-sm text-foreground/70">
          {closed[0]?.closedMessage ?? texts.allText}
        </p>
        <Link
          href={localizePath(locale, "/#contact")}
          className="mt-1 text-sm font-bold text-accent-bordeaux underline"
        >
          {dict.common.seeNumbers}
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
          {pluralize(locale, texts.partialTitle, closed.length, {
            stores: closed
              .map((status) => dict.stores[status.store].name)
              .join(texts.and),
          })}
        </p>
        <p className="text-sm text-foreground/75">
          {closed[0]?.closedMessage ?? texts.partialText}
        </p>
      </div>
    </div>
  );
}
