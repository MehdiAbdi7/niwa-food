import { DEMO_MODE } from "@/config/site";

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
 */
export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <p className="bg-primary px-3 py-1 text-center text-xs font-bold leading-snug text-on-primary">
      <span className="sm:hidden">
        Site de démo : commandes non transmises au restaurant.
      </span>
      <span className="hidden sm:inline">
        Site de démonstration : les commandes ne sont pas transmises au
        restaurant.
      </span>
      <span className="hidden lg:inline">
        {" "}
        Projet personnel de Mehdi Abdi, sans lien officiel avec Niwa Food.
      </span>
    </p>
  );
}
