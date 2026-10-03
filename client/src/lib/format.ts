// Dinar algérien : pas de devise Intl standard fiable partout, on formate à la main.
export function formatDA(value: number): string {
  return `${value.toLocaleString("fr-FR")} DA`;
}

/**
 * Montant abrégé, pour les endroits où la place est comptée.
 *
 * Une case de calendrier fait ~48 px de large sur un téléphone : « 68 000 DA »
 * y déborde ou force une taille de police illisible, « 68k » passe. On ne
 * l'utilise QUE dans ce contexte — un montant tronqué dans un ticket ou un
 * total serait inacceptable.
 */
export function formatCompactDA(value: number): string {
  if (value >= 1_000_000) {
    // Une décimale suffit : à ce niveau, le chiffre sert d'ordre de grandeur.
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Jour d'une journée commerciale (`serviceDate`).
 *
 * `timeZone: "UTC"` est OBLIGATOIRE ici, contrairement aux fonctions
 * ci-dessus. `serviceDate` est stockée à minuit UTC : la laisser interpréter
 * dans le fuseau du navigateur afficherait « 28/02 » pour une journée du 1er
 * mars dès que le lecteur est à l'ouest de Greenwich.
 */
export function formatServiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
