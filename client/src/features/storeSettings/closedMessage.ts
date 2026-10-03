// DOIT rester aligné sur DEFAULT_CLOSED_MESSAGE dans utils/storeStatus.ts côté
// backend : le client peut lire ce message ici (avant l'envoi) comme là-bas
// (dans le 503), et deux formulations différentes pour la même situation
// donneraient l'impression de deux problèmes distincts.
export const DEFAULT_CLOSED_MESSAGE =
  "Ce restaurant ne prend plus de commandes en ligne pour le moment.";
