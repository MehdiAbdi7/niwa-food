import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FixedBackground } from "@/components/public/FixedBackground";
import { OrderLookupForm } from "@/components/publicOrder/OrderLookupForm";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { lookup } = getDictionary(lang);

  return {
    title: lookup.metaTitle,
    description: lookup.metaDescription,
    // noindex : cette page n'a d'intérêt que pour quelqu'un qui a une commande
    // en cours, elle n'a rien à faire dans un moteur de recherche.
    robots: { index: false, follow: true },
  };
}

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
export default async function SuiviLookupPage({ params }: PageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <>
      <FixedBackground />
      <OrderLookupForm />
    </>
  );
}
