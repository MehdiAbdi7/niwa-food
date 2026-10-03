/**
 * Neutralise les métacaractères d'une saisie utilisateur avant de la passer à
 * `$regex`.
 *
 * Ce n'est PAS cosmétique. Sans échappement :
 *   - une recherche « (a+)+$ » construit une expression à backtracking
 *     exponentiel, exécutée par le serveur Mongo sur chaque document du
 *     périmètre — c'est une attaque ReDoS, avec un déni de service à la clé ;
 *   - une saisie contenant « ( » lève simplement une erreur de compilation
 *     regex, donc un 500 sur une frappe parfaitement légitime.
 *
 * `$&` réinsère la séquence capturée, préfixée d'un antislash.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
