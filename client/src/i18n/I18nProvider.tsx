"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/fr";

interface I18nValue {
  locale: Locale;
  dict: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Donne la langue et ses textes aux composants client du site public.
 *
 * Le dictionnaire est chargé côté serveur par app/[lang]/layout.tsx, puis
 * passé ici une seule fois. Les composants serveur, eux, n'ont pas accès à
 * un contexte React : ils appellent getDictionary() directement.
 */
export function I18nProvider({
  locale,
  dict,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return <I18nContext value={{ locale, dict }}>{children}</I18nContext>;
}

/**
 * Langue et textes de la page, dans un composant client.
 *
 * Le back-office n'a pas de provider : appeler ce hook depuis un composant
 * partagé avec le dashboard lèverait l'erreur ci-dessous. Ces composants
 * reçoivent leurs textes en props, avec le français par défaut.
 */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error(
      "useI18n doit être appelé sous <I18nProvider>, donc sur le site public.",
    );
  }
  return value;
}
