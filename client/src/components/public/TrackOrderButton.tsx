"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getLastOrderServerSnapshot,
  getLastOrderSnapshot,
  parseLastOrder,
  subscribeLastOrder,
} from "@/lib/lastOrder";
import { useI18n } from "@/i18n/I18nProvider";
import { localizePath, stripLocale } from "@/i18n/config";
import { fill } from "@/i18n/text";

/**
 * Raccourci vers la dernière commande passée.
 *
 * Sans compte client, cet identifiant en localStorage est le SEUL lien entre
 * le visiteur et sa commande : sans ce bouton, fermer l'onglet revient à
 * perdre son suivi définitivement.
 *
 * useSyncExternalStore plutôt qu'un useState alimenté par un useEffect :
 * localStorage est précisément une source de données extérieure à React, et
 * c'est le crochet prévu pour ça. Il accepte un instantané serveur distinct
 * (null), ce qui évite toute divergence d'hydratation, et supprime le rendu
 * supplémentaire qu'imposait le setState dans l'effet.
 */
export function TrackOrderButton() {
  const { locale, dict } = useI18n();
  const pathname = stripLocale(usePathname());

  const raw = useSyncExternalStore(
    subscribeLastOrder,
    getLastOrderSnapshot,
    getLastOrderServerSnapshot,
  );

  // `raw` est une chaîne, donc stable d'un rendu à l'autre : l'analyse n'est
  // refaite que lorsque le contenu stocké change réellement.
  const lastOrder = useMemo(() => parseLastOrder(raw), [raw]);

  if (!lastOrder) return null;

  // Inutile de proposer d'aller là où on est déjà.
  if (pathname === `/commande/suivi/${lastOrder.id}`) return null;

  return (
    <Link
      href={localizePath(locale, `/commande/suivi/${lastOrder.id}`)}
      aria-label={fill(dict.nav.trackOrder, { number: lastOrder.dailyNumber })}
      className="flex h-9 items-center gap-1.5 rounded-full border-2 border-accent-green/80 bg-accent-green/10 px-2.5 font-bold text-accent-green backdrop-blur-2xl transition-colors hover:bg-accent-green/20 sm:pe-3"
    >
      <span className="icon-[mdi--progress-clock] size-5" />
      <span className="tabular-nums hidden text-sm sm:inline">
        #{lastOrder.dailyNumber}
      </span>
    </Link>
  );
}
