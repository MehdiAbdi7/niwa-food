/**
 * Réglages globaux du site public.
 *
 * SITE_URL sert de base aux URL absolues (aperçus de partage, sitemap, données
 * structurées) : un aperçu WhatsApp ou Facebook ignore une image en chemin
 * relatif.
 */
export const SITE_URL = "https://niwa-food.vercel.app";

/**
 * Mode démo, actif par défaut.
 *
 * Le site reprend le nom, les adresses et les numéros d'un vrai restaurant
 * qui ne l'a pas encore validé. Tant que c'est le cas, il doit le dire :
 * bandeau visible, pages non indexées, et mention claire au moment de
 * commander, car une commande passée ici n'est préparée par personne.
 *
 * Le jour où le restaurant donne son accord, il suffit de poser
 * NEXT_PUBLIC_DEMO_MODE=false dans les variables d'environnement Vercel :
 * le bandeau disparaît, l'indexation et les données structurées s'activent,
 * sans toucher au code.
 *
 * Préfixe NEXT_PUBLIC_ : la valeur est lue aussi par des composants client
 * (le bandeau, le formulaire de commande), elle doit donc être inlinée au
 * build dans le JavaScript envoyé au navigateur.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
