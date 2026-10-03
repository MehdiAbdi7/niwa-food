import Link from "next/link";
import { publicFetch } from "@/lib/publicFetch";
import { buildMenuNav } from "@/features/menu/menuNav";
import { FixedBackground } from "@/components/public/FixedBackground";
import { MenuFilters } from "@/components/publicOrder/MenuFilters";
import { DishList } from "@/components/publicOrder/DishList";
import { CartBar } from "@/components/publicOrder/CartBar";
import { StoreClosedNotice } from "@/components/publicOrder/StoreClosedNotice";
import type { MenuCategory, MenuItem } from "@/types/menuItem";

export const metadata = {
  title: "Commander — Niwa Food",
  description:
    "Composez votre commande Niwa Food : sur place, à emporter ou en livraison à Kouba et Chéraga.",
};

// Le menu change quelques fois par jour, pas par minute : une minute de cache
// suffit largement et évite de taper le backend Render à chaque scan de QR.
export const revalidate = 60;

/**
 * Server Component : c'est ici que le menu est chargé et la navigation
 * calculée, donc le client reçoit du HTML déjà rempli — pas de skeleton, pas
 * d'attente du JS. Les îlots ci-dessous sont les seuls morceaux interactifs,
 * et ils ne se parlent qu'à travers Redux.
 *
 * Le ticket (CartSheet) n'est plus monté ici mais dans le layout public : il
 * doit rester ouvrable depuis le bouton panier de la navbar, sur toutes les
 * pages.
 *
 * L'état d'ouverture des magasins n'est volontairement PAS chargé ici : avec
 * le `revalidate` ci-dessus, un statut figé dans le HTML pourrait annoncer
 * « ouvert » jusqu'à une minute après la fermeture. StoreClosedNotice le lit
 * côté client, où il est toujours frais.
 */
export default async function CommandePage() {
  const [items, categories] = await Promise.all([
    publicFetch<MenuItem[]>("/menu-items"),
    publicFetch<MenuCategory[]>("/menu-categories"),
  ]);

  if (!items || !categories) {
    return (
      <>
        <FixedBackground />

        <div className="relative z-10 mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="icon-[mdi--wifi-off] text-5xl text-foreground/25" />
          <h1 className="font-heading text-xl font-bold text-foreground">
            Le menu est momentanément indisponible
          </h1>
          <p className="text-sm text-foreground/75">
            Rechargez la page dans un instant, ou appelez-nous directement.
          </p>
          {/* <a> natif : cette page peut s'afficher avant même le chargement du JS */}
          <a
            href="/commande"
            className="mt-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary"
          >
            Réessayer
          </a>
          <Link
            href="/#contact"
            className="text-sm font-semibold text-accent-green"
          >
            Voir nos numéros
          </Link>
        </div>
      </>
    );
  }

  // Filtré côté serveur : un produit épuisé n'est ni commandable ni affiché,
  // autant ne pas l'envoyer du tout au navigateur.
  const availableItems = items.filter((item) => item.available);
  const nav = buildMenuNav(categories, availableItems);

  return (
    <>
      <FixedBackground />

      {/* relative z-10 obligatoire : sans lui, tout le contenu passerait sous
          le fond fixe (voir le commentaire dans FixedBackground). */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-30 pt-28 sm:pt-28">
        {/* Avant l'en-tête, donc avant le premier plat : la fermeture doit se
            lire au premier coup d'œil, pas après avoir scrollé la carte. */}
        <StoreClosedNotice />

        {/* items-start est ce qui rend le sticky de la colonne opérant : sans
            lui, align-items:stretch étire l'aside sur toute la hauteur de la
            rangée, et un élément déjà aussi haut que son conteneur n'a plus
            aucune marge pour coller. */}
        {/* L'en-tête est DANS la colonne de droite, et non au-dessus de la
            rangée. C'est ce qui rend la colonne de navigation utilisable au
            chargement : `sticky` ne s'active qu'une fois qu'on a scrollé, donc
            tant qu'on est en haut de page la colonne occupe sa position
            naturelle. Placé au-dessus, le titre la poussait ~290px plus bas,
            alors que son max-height se calcule depuis le haut du viewport —
            elle dépassait donc de l'écran d'exactement la hauteur du titre.
            Ici elle démarre en haut de la zone de contenu et tient toujours. */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
          <MenuFilters nav={nav} />

          {/* min-w-0 : sans lui, un enfant de flex refuse de passer sous la
              largeur de son contenu, et une longue description de plat
              élargirait la grille au-delà de la colonne. */}
          <div className="min-w-0 flex-1">
            <header className="mb-6 flex flex-col gap-1.5">
              <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
                Notre carte
              </span>
              <h1 className="font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Composez votre commande
              </h1>
              <p className="text-sm text-foreground/75">
                Sur place, à emporter ou en livraison. Vous choisirez à la fin.
              </p>
            </header>

            <DishList items={availableItems} nav={nav} />
          </div>
        </div>

        <CartBar />
      </div>
    </>
  );
}
