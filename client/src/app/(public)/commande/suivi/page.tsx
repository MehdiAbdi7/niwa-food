import type { Metadata } from "next";
import { FixedBackground } from "@/components/public/FixedBackground";
import { OrderLookupForm } from "@/components/publicOrder/OrderLookupForm";

export const metadata: Metadata = {
  title: "Suivre ma commande — Niwa Food",
  description:
    "Entrez votre numéro de commande pour suivre sa préparation en direct.",
  // noindex : cette page n'a d'intérêt que pour quelqu'un qui a une commande
  // en cours, elle n'a rien à faire dans un moteur de recherche.
  robots: { index: false, follow: true },
};

/**
 * Point d'entrée du suivi, pour un client sans lien.
 *
 * Coquille serveur volontairement nue : le formulaire est un Client Component
 * (état, lecture de localStorage, appel API), mais il n'utilise PAS
 * useSearchParams — pas de <Suspense> nécessaire ici, contrairement à
 * /login ou /commande/finaliser.
 *
 * Le fond fixe est le même que la carte et le tunnel de commande : cet écran
 * doit se lire comme une pièce du même site, pas comme un formulaire isolé.
 */
export default function SuiviLookupPage() {
  return (
    <>
      <FixedBackground />
      <OrderLookupForm />
    </>
  );
}
