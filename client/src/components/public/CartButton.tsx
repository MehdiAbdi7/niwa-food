"use client";

import { useCart } from "@/features/publicOrder/useCart";
import { formatDA } from "@/lib/format";

/**
 * Accès au panier depuis la navbar, sur toutes les pages publiques.
 *
 * Masqué tant que le panier est vide : un panier à zéro n'est pas une
 * information, juste un bouton mort de plus dans une barre déjà chargée.
 *
 * Le ticket qu'il ouvre est monté par le layout public, pas par la page
 * /commande — sans quoi ce bouton ne ferait rien depuis l'accueil.
 */
export function CartButton() {
  const { count, total, openTicket } = useCart();

  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={openTicket}
      aria-label={`Voir mon panier, ${count} article${count > 1 ? "s" : ""}`}
      className="relative flex h-9 items-center gap-2 rounded-full border-2 border-foreground/80 bg-primary/20 px-2.5 font-bold text-foreground/80 backdrop-blur-2xl transition-colors hover:border-accent-green hover:text-accent-green sm:pl-3 sm:pr-4"
    >
      <span className="icon-[mdi--cart] size-5" />

      {/* Le total n'apparaît qu'à partir de sm : sur mobile la barre est déjà
          serrée entre le logo et le hamburger, et CartBar l'affiche en bas. */}
      <span className="tabular-nums hidden text-sm sm:inline">
        {formatDA(total)}
      </span>

      {/* key={count} : remonte la pastille à chaque changement, ce qui rejoue
          l'animation — c'est le seul retour visuel qu'un ajout a bien été pris
          en compte quand on est loin de la barre du bas. */}
      <span
        key={count}
        className="tabular-nums absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-green px-1 text-xs font-bold text-on-primary motion-safe:animate-[toastIn_0.25s_ease-out]"
      >
        {count}
      </span>
    </button>
  );
}
