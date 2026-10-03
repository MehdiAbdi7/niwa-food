/**
 * Construction de la grille du calendrier.
 *
 * Volontairement PUR et sans React : aucune dépendance, aucun état, donc
 * lisible d'un coup d'œil et vérifiable dans une console. Le backend n'a rien
 * à faire ici — il renvoie les jours qui ont eu des ventes, le front fabrique
 * les 31 cases et grise celles qui n'ont pas de données.
 *
 * Tous les calculs passent par `Date.UTC` et `getUTC*`. Utiliser `new Date(y,
 * m, d)` interpréterait les valeurs dans le fuseau du NAVIGATEUR : un gérant
 * consultant l'historique depuis la France verrait la grille décalée d'un jour
 * par rapport aux données, qui sont normalisées en UTC côté serveur.
 */

export const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Version courte pour les cases du calendrier : « Septembre » déborde d'une
// case de 80 px, « Sep » non.
export const MONTH_SHORT_NAMES = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

// Semaine à la française : lundi en premier. L'ordre de ce tableau DOIT
// correspondre à celui produit par getMondayFirstOffset ci-dessous.
export const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Nombre de jours d'un mois (month = 1..12). */
export function getDaysInMonth(year: number, month: number): number {
  // Le jour 0 du mois suivant est le dernier jour du mois courant — ça gère
  // février et les années bissextiles sans aucun cas particulier.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Nombre de cases vides à insérer avant le 1er du mois.
 *
 * `getUTCDay()` renvoie 0 pour dimanche et 1 pour lundi. `(jour + 6) % 7`
 * ramène lundi à 0 et dimanche à 6, ce qui correspond à WEEKDAY_LABELS.
 */
export function getMondayFirstOffset(year: number, month: number): number {
  return (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
}

/**
 * Grille d'un mois : les cases vides du début, puis les jours.
 *
 * `null` = case de remplissage (le mois n'a pas encore commencé), un nombre =
 * un vrai jour. On ne complète PAS la fin de la grille : une rangée
 * incomplète en bas se lit très bien, et des cases vides supplémentaires
 * n'apporteraient rien.
 */
export function buildMonthGrid(
  year: number,
  month: number,
): (number | null)[] {
  const offset = getMondayFirstOffset(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

/**
 * Libellé de la sélection courante, du plus large au plus précis.
 * Sert d'en-tête à la liste : le lecteur doit savoir ce qu'il regarde.
 */
export function formatSelectionLabel(
  year: number | null,
  month: number | null,
  day: number | null,
): string {
  if (year === null) return "";
  if (month === null) return `Année ${year}`;
  if (day === null) return `${MONTH_NAMES[month - 1]} ${year}`;
  return `${day} ${MONTH_NAMES[month - 1].toLowerCase()} ${year}`;
}

/**
 * Date d'une journée commerciale, telle que le backend l'attend en query.
 * Utile pour l'export CSV et les libellés de fichier.
 */
export function formatServiceDayKey(
  year: number,
  month?: number | null,
  day?: number | null,
): string {
  const pad = (value: number) => value.toString().padStart(2, "0");

  if (!month) return `${year}`;
  if (!day) return `${year}-${pad(month)}`;
  return `${year}-${pad(month)}-${pad(day)}`;
}
