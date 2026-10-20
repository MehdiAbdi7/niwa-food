import type { Metadata } from "next";
import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";
import { CartSheet } from "@/components/publicOrder/CartSheet";
import { CartHydrator } from "@/features/publicOrder/CartHydrator";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getDictionary } from "@/i18n/getDictionary";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getDirection,
  hasLocale,
  localizePath,
} from "@/i18n/config";
import { HtmlShell, sharedMetadata } from "../html-shell";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

// Une version statique de chaque page par langue, générée au build : le
// multilingue ne coûte aucun calcul au moment de la visite.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return {
    ...sharedMetadata,
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: localizePath(locale, "/"),
      siteName: "Niwa Food",
      locale: dict.meta.ogLocale,
      type: "website",
    },
  };
}

/**
 * Layout racine du site public, dans la langue de l'URL.
 *
 * /ar/... arrive ici avec lang = "ar". Une adresse française (/commande)
 * aussi, avec lang = "fr" : proxy.ts la réécrit en /fr/commande sans que
 * l'adresse change dans le navigateur.
 *
 * Une valeur inconnue (/dashboard/xyz arrive ici avec lang = "dashboard")
 * n'est PAS rejetée par le layout : il s'affiche en français, et c'est la
 * page qui répond 404. Un notFound() lancé ici, dans un layout racine,
 * tomberait sur la page 404 anglaise par défaut de Next.
 */
export default async function PublicLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  const locale = hasLocale(lang) ? lang : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <HtmlShell lang={locale} dir={getDirection(locale)}>
      <I18nProvider locale={locale} dict={dict}>
        <div className="flex min-h-screen flex-col justify-between bg-background text-foreground">
          {/* Ne rend rien : relit le panier sauvegardé et le pousse dans Redux.
              Ici et non dans /commande, car le bouton panier de la navbar doit
              afficher le bon compte dès l'accueil. */}
          <CartHydrator />

          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} dict={dict} />

          {/* Monté ici et non dans /commande : le bouton panier de la navbar est
              présent sur toutes les pages publiques, il lui faut un ticket à
              ouvrir partout. Le composant ne rend rien tant qu'il est fermé. */}
          <CartSheet />
        </div>
      </I18nProvider>
    </HtmlShell>
  );
}
