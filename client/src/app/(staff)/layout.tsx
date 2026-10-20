import type { Metadata } from "next";
import { HtmlShell, sharedMetadata } from "../html-shell";

const DEFAULT_TITLE =
  "Niwa Food — Burgers, tacos et pizzas faits maison à Kouba et Chéraga";
const DEFAULT_DESCRIPTION =
  "Fast-food fait maison à Alger : burgers, tacos et pizzas préparés minute. Sur place, à emporter ou en livraison à Kouba et Chéraga.";

export const metadata: Metadata = {
  ...sharedMetadata,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
};

/**
 * Layout racine du back-office : connexion, dashboard et espace livreur.
 *
 * Le groupe (staff) ne change aucune URL (/login, /dashboard... restent
 * identiques). Il existe pour donner à ces pages leur propre <html>, en
 * français, à côté de celui du site public multilingue (app/[lang]).
 */
export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HtmlShell lang="fr" dir="ltr">
      {children}
    </HtmlShell>
  );
}
