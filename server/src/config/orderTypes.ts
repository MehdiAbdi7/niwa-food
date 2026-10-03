/**
 * Types de commande, sous forme de liste.
 *
 * Extrait dans une constante pour la même raison que STORES : l'historique a
 * besoin d'énumérer TOUS les types quand l'utilisateur choisit « Tous », et
 * une liste recopiée dans le validateur, le contrôleur et le modèle finit
 * toujours par diverger le jour où un quatrième mode de service apparaît.
 */
export const ORDER_TYPES = ["dine_in", "takeaway", "delivery"] as const;

export type OrderType = (typeof ORDER_TYPES)[number];
