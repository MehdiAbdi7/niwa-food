import type { HistoryListItem } from "@/features/history/historyApi";
import { ORDER_TYPE_LABELS } from "./orderLabels";
import { formatServiceDate } from "./format";
import { STORE_LABELS } from "@/types/store";

/**
 * Neutralise les injections de formules dans un tableur.
 *
 * Une cellule commençant par `=`, `+`, `-` ou `@` est interprétée comme une
 * FORMULE par Excel et LibreOffice. Un client nommé « =cmd|'/c calc'!A1 »
 * (ou simplement « -Ali ») transforme donc l'export en exécution de code chez
 * la personne qui l'ouvre. Le préfixe apostrophe force le mode texte.
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function toCsvCell(value: string): string {
  // Guillemets doublés : c'est l'échappement prévu par le format CSV lui-même.
  return `"${neutralizeFormula(value).replace(/"/g, '""')}"`;
}

/**
 * Export de la PAGE affichée, volontairement — pas de la sélection entière.
 *
 * Exporter une année complète demanderait de rapatrier des dizaines de
 * milliers de lignes dans le navigateur, exactement ce que la pagination
 * cherche à éviter. Un export exhaustif mérite un endpoint dédié qui streame
 * la réponse côté serveur, pas un fetch-all déguisé côté client. Le libellé
 * du bouton dit clairement « cette page ».
 */
export function exportHistoryToCsv(
  orders: HistoryListItem[],
  filename: string,
): void {
  const header = [
    "N°",
    "Journée",
    "Magasin",
    "Client",
    "Type",
    "Total (DA)",
    "Encaissée le",
  ];

  const rows = orders.map((order) => [
    order.dailyNumber.toString(),
    formatServiceDate(order.serviceDate),
    STORE_LABELS[order.store],
    order.client.fullName,
    ORDER_TYPE_LABELS[order.type],
    order.totalPrice.toString(),
    order.completedAt
      ? new Date(order.completedAt).toLocaleString("fr-FR")
      : "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(toCsvCell).join(","))
    .join("\r\n"); // CRLF : ce que la spec CSV attend, et ce qu'Excel préfère

  // BOM UTF-8, sans quoi Excel affiche « ChÃ©raga » à l'ouverture.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  // Sans révocation, le blob reste en mémoire jusqu'au rechargement de la
  // page — quelques exports de suite et c'est plusieurs Mo retenus pour rien.
  URL.revokeObjectURL(url);
}
