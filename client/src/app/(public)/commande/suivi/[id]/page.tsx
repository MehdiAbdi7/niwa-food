import { OrderTrackingView } from "@/components/publicOrder/OrderTrackingView";

export const metadata = {
  title: "Suivi de commande — Niwa Food",
  // noindex : ces URLs contiennent l'identifiant d'une commande réelle, elles
  // n'ont rien à faire dans un moteur de recherche.
  robots: { index: false, follow: false },
};

/**
 * Suivi public d'une commande.
 *
 * Volontairement PAS de préchargement serveur : le statut change en
 * permanence, un HTML mis en cache afficherait « commande reçue » à quelqu'un
 * dont le burger est déjà prêt. Tout passe par le hook, qui combine socket et
 * polling de secours.
 *
 * Params est asynchrone (Next 15+) : d'où le await.
 */
export default async function SuiviCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderTrackingView orderId={id} />;
}
