import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTrackingView } from "@/components/publicOrder/OrderTrackingView";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  return {
    title: getDictionary(lang).tracking.metaTitle,
    // noindex : ces URLs contiennent l'identifiant d'une commande réelle, elles
    // n'ont rien à faire dans un moteur de recherche.
    robots: { index: false, follow: false },
  };
}

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
export default async function SuiviCommandePage({ params }: PageProps) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  return <OrderTrackingView orderId={id} />;
}
