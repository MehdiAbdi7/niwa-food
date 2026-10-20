"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/features/publicOrder/useCart";
import {
  tiltOnPointerLeave,
  tiltOnPointerMove,
} from "@/features/motion/pointerEffects";
import { formatDA } from "@/lib/format";
import { useI18n } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/config";
import type { MenuItem } from "@/types/menuItem";

interface BestSellerCardProps {
  item: MenuItem;
  /** Copie latérale du carrousel : hors du parcours clavier. */
  isDuplicate?: boolean;
}

// Décrit la largeur d'AFFICHAGE de la vignette, pas le poids du fichier : le
// navigateur choisit la variante du srcset avec cette seule information, avant
// même d'avoir appliqué le CSS. Elle suit les `basis` du carrousel (≈60 % de
// la largeur écran sur mobile, ≈36 % en sm, ≈260 px en lg).
const CARD_IMAGE_SIZES =
  "(max-width: 640px) 60vw, (max-width: 1024px) 36vw, 260px";

export function BestSellerCard({
  item,
  isDuplicate = false,
}: BestSellerCardProps) {
  const { openProduct } = useCart();
  const { locale, dict } = useI18n();

  const lowestPrice = item.variants.length
    ? Math.min(...item.variants.map((variant) => variant.price))
    : null;

  // Même mécanique que le bouton « Modifier » du ticket : la cible vit dans
  // Redux, DishList la lit au montage et ouvre la fiche. Rien à transporter
  // dans l'URL, et le client arrive sur le produit qu'il a touché plutôt que
  // d'avoir à le retrouver dans une carte de 33 articles.
  //
  // <Link> et non <button> : le clic droit, l'ouverture en nouvel onglet et
  // l'aperçu de l'URL au survol continuent de fonctionner. Dans ce cas la
  // fiche ne s'ouvre pas, le state Redux ne franchit pas un nouvel onglet,
  // mais le client atterrit bien sur la carte, ce qui reste correct.
  return (
    <Link
      href={localizePath(locale, "/commande")}
      onClick={() => openProduct(item._id)}
      onPointerMove={tiltOnPointerMove}
      onPointerLeave={tiltOnPointerLeave}
      // Le lien des copies reste cliquable à la souris mais sort du parcours
      // clavier : sans ça, neuf produits produiraient vingt-sept arrêts de
      // tabulation, dont dix-huit sur du contenu aria-hidden.
      tabIndex={isDuplicate ? -1 : undefined}
      // Pas d'aria-label : le nom du lien vient de son contenu (nom, prix,
      // description). Un aria-label « POLINI, voir sur la carte » ne
      // contenait pas le texte visible, et un utilisateur de commande vocale
      // qui dit « 350 DA » n'aurait rien trouvé (règle WCAG 2.5.3, signalée
      // par Lighthouse).
      // h-full : le wrapper est étiré à la hauteur de la rangée par le flex
      // parent, mais la carte garderait sa hauteur de contenu. C'est ce h-full
      // qui aligne les cartes entre elles.
      className="tilt-card group relative flex h-full flex-col rounded-[1.75rem] border border-primary bg-surface p-2.5 shadow-[0_18px_30px_-22px_rgb(61_39_22/0.55)] ring-1 ring-border-subtle focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
    >
      {/* Vignette. shrink-0 indispensable : un enfant de flex en
          aspect-ratio se laisse comprimer quand une voisine plus haute étire
          la carte, et les photos perdent leur alignement. Pas d'overflow
          hidden : au survol, le plat sort du cadre. */}
      <div className="relative aspect-square w-full shrink-0 rounded-[1.35rem] bg-primary/10">
        {/* Ombre posée sous le plat : un dégradé, bien moins coûteux qu'un
            filtre drop-shadow sur vingt-sept images détourées. Elle se
            resserre quand le plat s'élève. */}
        <span
          aria-hidden="true"
          className="absolute bottom-[9%] left-[18%] right-[18%] h-[9%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(30_15_5/0.3),transparent)] transition-transform duration-500 motion-safe:group-hover:scale-x-75"
        />

        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes={CARD_IMAGE_SIZES}
            className="object-contain p-[9%] transition-transform duration-700 ease-(--ease-pop) motion-safe:group-hover:-translate-y-[9%] motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              aria-hidden="true"
              className="icon-[mdi--food] text-5xl text-foreground/40"
            />
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-1 px-2 pb-2 pt-5">
        <p className="font-heading text-lg font-bold leading-tight text-foreground">
          {item.name}
        </p>

        {/* Pastille de prix, collée de travers à cheval sur la vignette.
            Placée APRÈS le nom dans le code, même si elle s'affiche au-dessus
            de lui : le lien est lu dans l'ordre du code, « MALOSSI, dès
            450 DA » plutôt que « dès 450 DA, MALOSSI ».
            « dès » quand plusieurs variantes : afficher le prix de la première
            seule laisserait croire qu'un tacos L coûte le prix d'un M. Même
            règle que DishCard et MenuItemCard. */}
        {lowestPrice !== null && (
          <span className="absolute -top-4 right-3 -rotate-6 rounded-full bg-sticker px-3 py-1.5 font-heading text-sm font-bold leading-none text-sticker-ink shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-(--ease-pop) motion-safe:group-hover:rotate-3 motion-safe:group-hover:scale-110">
            {item.variants.length > 1 && (
              <span className="font-body font-semibold">
                {dict.common.from}{" "}
              </span>
            )}
            {formatDA(lowestPrice, locale)}
          </span>
        )}
        {/* min-h : une carte sans description laisserait un creux là où ses
            voisines ont deux lignes. On réserve la place même à vide. */}
        <p className="line-clamp-2 min-h-10 text-sm leading-snug text-foreground/75">
          {item.description}
        </p>
      </div>
    </Link>
  );
}
