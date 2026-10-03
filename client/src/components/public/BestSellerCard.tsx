"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/features/publicOrder/useCart";
import type { MenuItem } from "@/types/menuItem";

interface BestSellerCardProps {
  item: MenuItem;
  /** Copie latérale du carrousel : hors du parcours clavier. */
  isDuplicate?: boolean;
}

// Décrit la largeur d'AFFICHAGE de la vignette, pas le poids du fichier : le
// navigateur choisit la variante du srcset avec cette seule information, avant
// même d'avoir appliqué le CSS. Elle suit les `basis` du carrousel (≈42% de la
// largeur écran sur mobile, ≈28% en sm, ≈300 px en lg dans un max-w-6xl).
const CARD_IMAGE_SIZES =
  "(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 300px";

export function BestSellerCard({
  item,
  isDuplicate = false,
}: BestSellerCardProps) {
  const { openProduct } = useCart();

  // Même mécanique que le bouton « Modifier » du ticket : la cible vit dans
  // Redux, DishList la lit au montage et ouvre la fiche. Rien à transporter
  // dans l'URL, et le client arrive sur le produit qu'il a touché plutôt que
  // d'avoir à le retrouver dans une carte de 33 articles.
  //
  // <Link> et non <button> : le clic droit, l'ouverture en nouvel onglet et
  // l'aperçu de l'URL au survol continuent de fonctionner. Dans ce cas la
  // fiche ne s'ouvre pas — le state Redux ne franchit pas un nouvel onglet —
  // mais le client atterrit bien sur la carte, ce qui reste correct.
  return (
    <Link
      href="/commande"
      onClick={() => openProduct(item._id)}
      // Le lien des copies reste cliquable à la souris mais sort du parcours
      // clavier : sans ça, huit produits produiraient vingt-quatre arrêts de
      // tabulation, dont seize sur du contenu aria-hidden.
      tabIndex={isDuplicate ? -1 : undefined}
      aria-label={`${item.name}, voir sur la carte`}
      // h-full : le wrapper est déjà étiré à la hauteur de la rangée par le
      // flex parent, mais la carte, elle, garderait sa hauteur de contenu.
      // C'est ce h-full qui lui fait remplir la place offerte, donc qui aligne
      // les cartes entre elles.
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-primary bg-background ring-1 ring-primary/10 backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_0_30px_5px_rgba(217,169,77,0.45)] hover:shadow-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green motion-safe:hover:-translate-y-1.5"
    >
      {/* Photo — shrink-0 indispensable : un enfant de flex en aspect-ratio se
          laisse comprimer quand la carte est étirée par une voisine plus haute,
          et les photos perdent alors leur alignement d'une carte à l'autre. */}
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-primary/20">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes={CARD_IMAGE_SIZES}
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="icon-[mdi--food] text-4xl text-primary/40" />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="relative flex flex-1 flex-col items-center gap-1 p-3 pt-5 text-center">
        {/* Étiquette de prix, épinglée à cheval sur la photo et le contenu */}
        <div className="absolute -top-4 right-2 z-10 -rotate-3">
          <div
            className="flex items-center gap-1.5 whitespace-nowrap bg-accent-green py-1.5 pl-4 pr-3 text-xs font-bold text-on-primary shadow-[0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-background/30"
            style={{
              clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-background/70" />
            {/* « dès » quand plusieurs variantes : afficher le prix de la
                première seule laisserait croire qu'un tacos L coûte le prix
                d'un M. Même règle que DishCard et MenuItemCard. */}
            {item.variants.length > 1 && (
              <span className="font-normal opacity-80">dès</span>
            )}
            {item.variants.length
              ? Math.min(...item.variants.map((v) => v.price))
              : "—"}{" "}
            DA
          </div>
        </div>

        <p className="font-heading text-sm font-semibold leading-snug text-foreground">
          {item.name}
        </p>

        {/* min-h : une carte sans description laisserait un creux là où ses
            voisines ont deux lignes. On réserve la place même à vide. */}
        <p className="min-h-8 line-clamp-2 text-xs leading-snug text-foreground/75">
          {item.description}
        </p>
      </div>
    </Link>
  );
}
