import { Suspense } from "react";
import { publicFetch } from "@/lib/publicFetch";
import { FixedBackground } from "@/components/public/FixedBackground";
import { CheckoutForm } from "@/components/publicOrder/CheckoutForm";
import type { MenuItem } from "@/types/menuItem";

export const metadata = {
  title: "Finaliser ma commande — Niwa Food",
  description:
    "Renseignez vos informations et envoyez votre commande Niwa Food.",
};

// Même cache que la carte : cette page ne sert le menu que pour vérifier que
// le panier ne contient rien de périmé, une minute de fraîcheur suffit.
export const revalidate = 60;

/**
 * Coquille serveur du tunnel de finalisation.
 *
 * Elle ne fait qu'une chose côté données : récupérer les produits encore
 * commandables, pour que le formulaire puisse écarter une ligne devenue
 * invalide AVANT l'envoi. Sans ça, un panier restauré de la veille produirait
 * un 404 « Produit introuvable » au POST, incompréhensible pour le client.
 *
 * Le <Suspense> est obligatoire : CheckoutForm lit les paramètres d'URL via
 * useOrderContext (donc useSearchParams), qui n'a pas de valeur au prerender
 * statique. Même contrainte que LoginPage, et la frontière doit être ICI,
 * au-dessus du composant qui suspend.
 */
export default async function FinaliserPage() {
  const items = await publicFetch<MenuItem[]>("/menu-items");

  const availableItemIds = (items ?? [])
    .filter((item) => item.available)
    .map((item) => item._id);

  return (
    <>
      {/* Même fond que la carte : le tunnel de commande doit se lire comme la
          suite du même écran, pas comme une page d'un autre site. Le fallback
          le porte aussi, sinon le fond apparaîtrait après coup. */}
      <FixedBackground />

      <Suspense
        fallback={
          <div className="relative z-10 flex min-h-[60vh] items-center justify-center">
            <span
              aria-hidden="true"
              className="icon-[mdi--loading] animate-spin text-4xl text-primary"
            />
          </div>
        }
      >
        <CheckoutForm availableItemIds={availableItemIds} />
      </Suspense>
    </>
  );
}
