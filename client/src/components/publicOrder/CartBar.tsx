"use client";

import { useCart } from "@/features/publicOrder/useCart";
import { formatDA } from "@/lib/format";
import { useI18n } from "@/i18n/I18nProvider";
import { fill, pluralize } from "@/i18n/text";

// Trois vignettes suffisent à signaler « c'est bien ma commande » ; au-delà
// elles se chevauchent trop pour rester reconnaissables, et le compteur prend
// le relais.
const PREVIEW_LIMIT = 3;

/**
 * Barre flottante d'accès au panier.
 *
 * Elle affiche le total en permanence, ce qui est le point le plus demandé sur
 * une carte de fast-food : le client compose en surveillant son budget, sans
 * devoir ouvrir le ticket à chaque ajout.
 *
 * Les vignettes empilées à gauche ne sont pas décoratives : sur une carte de
 * 35 produits, elles confirment d'un coup d'œil CE QUI a été ajouté, alors
 * qu'un compteur seul ne dit que combien.
 */
export function CartBar() {
  const { lines, count, total, openTicket } = useCart();
  const { locale, dict } = useI18n();

  if (count === 0) return null;

  const preview = lines.slice(0, PREVIEW_LIMIT);
  const hidden = lines.length - preview.length;
  const itemsLabel = pluralize(locale, dict.common.items, count);

  return (
    <div
      className="fixed inset-x-0 z-30 px-4 sm:px-6"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={openTicket}
        aria-label={fill(dict.cart.openLabel, {
          items: itemsLabel,
          total: formatDA(total, locale),
        })}
        className="mx-auto flex h-16 w-full max-w-md items-center gap-3 rounded-full bg-primary ps-2.5 pe-4 text-on-primary shadow-[0_14px_38px_-10px_rgba(0,0,0,0.65)] transition-transform hover:scale-[1.02] active:scale-[0.99] motion-safe:animate-[cartBarIn_0.28s_ease-out]"
      >
        <span aria-hidden="true" className="flex shrink-0 items-center">
          {preview.map((line, index) => (
            <span
              key={line.key}
              // Chevauchement négatif : la pile évoque un sac qu'on remplit,
              // et tient dans la largeur d'une seule vignette et demie.
              className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-on-primary/15 ${
                index > 0 ? "-ms-4" : ""
              }`}
              style={{ zIndex: PREVIEW_LIMIT - index }}
            >
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="icon-[mdi--food] text-lg opacity-70" />
              )}
            </span>
          ))}

          {hidden > 0 && (
            <span className="tabular-nums -ms-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary bg-on-primary/20 text-xs font-bold">
              +{hidden}
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col text-start">
          <span className="font-heading text-base font-bold leading-tight">
            {dict.cart.open}
          </span>
          <span className="tabular-nums text-xs font-semibold opacity-75">
            {itemsLabel}
          </span>
        </span>

        <span className="tabular-nums shrink-0 font-heading text-base font-bold">
          {formatDA(total, locale)}
        </span>
        <span aria-hidden="true" className="icon-[mdi--chevron-up] shrink-0 text-xl opacity-80" />
      </button>
    </div>
  );
}
