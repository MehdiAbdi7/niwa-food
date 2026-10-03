/**
 * Journée commerciale ("serviceDate").
 *
 * PROBLÈME RÉSOLU ICI : le service de Niwa Food ferme à 00h30. Une commande
 * encaissée à 00h20 appartient au service de la veille, alors que son
 * `completedAt` porte la date du lendemain. Classer l'historique sur
 * `completedAt` faisait donc basculer les meilleures ventes de la soirée sur
 * la mauvaise case du calendrier.
 *
 * RÈGLE MÉTIER : c'est l'OUVERTURE du service qui décide de la date de toutes
 * ses commandes, quelle que soit l'heure réelle de l'encaissement. Un service
 * ouvert le 1er mars à 18h produit des commandes datées du 1er mars, même
 * celles servies à 00h20 le 2.
 *
 * CONSÉQUENCE : `serviceDate` est estampillée UNE FOIS à la création de la
 * commande (voir utils/dailyNumber.ts::issueOrderNumber), jamais recalculée.
 * C'est ce qui la rend indexable — recalculer le service d'appartenance à
 * chaque requête aurait imposé une jointure sur les compteurs, non indexable
 * et refaite à chaque page.
 */

// L'Algérie est à UTC+1 toute l'année, sans heure d'été : un offset constant
// suffit, pas besoin d'une bibliothèque de fuseaux (et de ses 300 Ko).
const ALGIERS_UTC_OFFSET_MS = 60 * 60 * 1000;

/**
 * Jour d'ouverture du service, normalisé à minuit UTC.
 *
 * Le stockage à minuit UTC n'est pas un détail : il garantit que
 * `$year` / `$month` / `$dayOfMonth` dans les agrégations renvoient
 * exactement le jour local voulu, sans option `timezone`, et que les bornes
 * construites avec `Date.UTC(...)` tombent juste.
 */
export function toServiceDate(openedAt: Date): Date {
  const local = new Date(openedAt.getTime() + ALGIERS_UTC_OFFSET_MS);

  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
}

export interface ServiceDateRange {
  start: Date;
  end: Date;
}

/**
 * Bornes [start, end) d'une sélection de calendrier.
 *
 * Le niveau de précision est déduit des paramètres fournis :
 *   (2026)          -> toute l'année
 *   (2026, 3)       -> tout le mois de mars
 *   (2026, 3, 14)   -> le 14 mars
 *
 * Intervalle semi-ouvert, jamais `$lte` : avec `$lte new Date(..., 23:59:59)`
 * on laisse échapper les millisecondes de la dernière seconde. `$lt` sur le
 * début de la période suivante est exact par construction.
 *
 * `Date.UTC` gère les débordements tout seul : `Date.UTC(2026, 11, 32)` donne
 * bien le 1er janvier 2027, donc aucun cas particulier à écrire pour décembre
 * ni pour le dernier jour du mois.
 */
export function serviceDateRange(
  year: number,
  month?: number,
  day?: number,
): ServiceDateRange {
  if (month === undefined) {
    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }

  if (day === undefined) {
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 1)),
    };
  }

  return {
    start: new Date(Date.UTC(year, month - 1, day)),
    end: new Date(Date.UTC(year, month - 1, day + 1)),
  };
}

/** Nombre de jours d'un mois donné (month = 1..12). */
export function getDaysInMonth(year: number, month: number): number {
  // Le jour 0 du mois suivant, c'est le dernier jour du mois courant.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
