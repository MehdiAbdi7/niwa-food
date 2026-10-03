import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * Restriction admin de /promotions.
 *
 * Même forme que (dashboard)/utilisateurs/layout.tsx, et pour la même raison :
 * la contrainte est portée par la ROUTE, pas par un drapeau passé à la page.
 * Une sous-page ajoutée ici plus tard en hériterait automatiquement, alors
 * qu'un `adminOnly` se serait oublié.
 *
 * Une remise est une décision commerciale : un employé peut SAISIR un code
 * existant sur une commande au comptoir (GET /promo-codes est ouvert au staff),
 * mais il n'en crée pas, et il n'en modifie pas le pourcentage.
 *
 * getSession() est mémoïsé par cache() : l'appel du layout parent n'est pas
 * refait ici.
 */
export default async function PromotionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (user?.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
