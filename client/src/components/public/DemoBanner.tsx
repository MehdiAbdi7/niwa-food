"use client";

import { DEMO_MODE } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Bandeau « démo », intégré en tête du header fixe.
 *
 * Dans le header plutôt qu'au-dessus de la page : le header est en
 * position: fixed, un bandeau placé avant lui dans le flux passerait dessous
 * et disparaîtrait au premier défilement. Ici, il reste visible partout, sur
 * toutes les pages publiques.
 *
 * Trois longueurs selon la largeur, pour tenir sur UNE ligne à chaque fois :
 * un bandeau sur deux lignes mange l'en-tête d'un téléphone.
 *
 * "use client" : il est rendu par la Navbar, un composant client, et lit
 * ses textes avec useI18n().
 */
export function DemoBanner() {
  const { dict } = useI18n();

  if (!DEMO_MODE) return null;

  return (
    <p className="bg-primary px-3 py-1 text-center text-xs font-bold leading-snug text-on-primary">
      <span className="sm:hidden">{dict.demoBanner.short}</span>
      <span className="hidden sm:inline">{dict.demoBanner.long}</span>
      <span className="hidden lg:inline"> {dict.demoBanner.author}</span>
    </p>
  );
}
