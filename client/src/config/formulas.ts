export type FormulaPricingMode = "fixed" | "supplement";

export interface FormulaChoice {
  label: string; // ex: "Boisson"
  // Les options ne sont plus figées : elles sont lues dans le menu, parmi les
  // produits disponibles de cette catégorie. Ajouter une canette suffit
  // désormais à la proposer en formule, sans toucher au code.
  fromCategoryName: string; // ex: "Canettes"
}

export interface Formula {
  id: string;
  name: string;
  // fixed      -> le prix REMPLACE celui de la variante (Menu Kids)
  // supplement -> le prix S'AJOUTE au prix de la variante (Menu burger)
  pricingMode: FormulaPricingMode;
  price: number;
  eligibleCategoryNames: string[];
  includedNames: string[]; // toujours servis, aucun choix
  choices: FormulaChoice[]; // le client doit trancher
  // Taille de référence pour les extras bySize (gratinage M/L) quand la
  // formule supprime la variante : un mini est facturé comme un M.
  extraSizeReference?: "M" | "L";
}

// DOIT rester identique à src/config/formulas.ts du backend : c'est lui qui
// fait foi à la commande. Une divergence ici produit des options affichées
// que l'API rejettera en 400.
export const FORMULAS: Formula[] = [
  {
    id: "menu_kids",
    name: "Menu Kids",
    pricingMode: "fixed",
    price: 500,
    eligibleCategoryNames: [
      "Pizzas",
      "Burgers",
      "Burgers Signature",
      "Tacos Classique",
      "Tacos Signature",
    ],
    // "Jus Rouiba" reste une chaîne libre : produit imposé, jamais choisi,
    // donc il n'a pas à référencer un MenuItem.
    includedNames: ["Frites", "Jus Rouiba"],
    choices: [],
    extraSizeReference: "M",
  },
  {
    id: "menu_burger",
    name: "Menu",
    pricingMode: "supplement",
    price: 250,
    eligibleCategoryNames: ["Burgers", "Burgers Signature"],
    includedNames: ["Frites"],
    // Canettes uniquement : les bouteilles ne sont pas servies en menu.
    choices: [{ label: "Boisson", fromCategoryName: "Canettes" }],
  },
];

export const FORMULA_BY_ID = new Map(FORMULAS.map((f) => [f.id, f]));
