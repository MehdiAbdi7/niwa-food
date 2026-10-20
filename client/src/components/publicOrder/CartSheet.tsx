"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sheet } from "./Sheet";
import { useCart } from "@/features/publicOrder/useCart";
import { useAppSelector } from "@/lib/hooks";
import { selectIsTicketOpen } from "@/features/publicOrder/cartSlice";
import { formatDA } from "@/lib/format";
import {
  describeLineOptions,
  getLineTotal,
  getLineUnitPrice,
  type CartLine,
  type LineDetailTone,
} from "@/lib/cartLine";
import { useI18n } from "@/i18n/I18nProvider";
import { localizePath, stripLocale } from "@/i18n/config";
import { fill, pluralize } from "@/i18n/text";

// Adresses sans langue : comparées à l'adresse courante sans sa langue, et
// passées par localizePath() avant de naviguer.
const ORDER_PATH = "/commande";
const CHECKOUT_PATH = "/commande/finaliser";

const DETAIL_CLASSES: Record<LineDetailTone, string> = {
  neutral: "text-foreground/75",
  formula: "text-accent-mustard font-semibold",
  extra: "text-accent-green",
  removed: "text-accent-bordeaux",
};

/**
 * Le panier client, dessiné comme un vrai ticket de caisse.
 *
 * Chiffres à chasse fixe, séparateurs pointillés, découpe dentelée en bas
 * (.ticket-notch, déjà dans globals.css) : le client reconnaît l'objet avant de
 * lire, ce qui rend le récapitulatif crédible au moment où il engage sa
 * commande. D'où aussi le placement="bottom" — on tire un ticket vers le haut,
 * on ne le fait pas apparaître au milieu de l'écran.
 *
 * Monté par le layout public, donc présent sur toutes les pages : le bouton
 * panier de la navbar peut l'ouvrir depuis l'accueil comme depuis la carte.
 */
export function CartSheet() {
  const pathname = stripLocale(usePathname());
  const router = useRouter();
  const { locale, dict } = useI18n();
  const isOpen = useAppSelector(selectIsTicketOpen);
  const {
    lines,
    count,
    total,
    setQuantity,
    removeLine,
    clear,
    closeTicket,
    openProduct,
  } = useCart();

  if (!isOpen) return null;

  // La cible reste dans Redux : en arrivant sur /commande, DishList la lit et
  // ouvre la fiche tout seul. Aucun état à transporter dans l'URL.
  function handleEdit(line: CartLine) {
    openProduct(line.menuItemId, line.key);
    if (pathname !== ORDER_PATH) router.push(localizePath(locale, ORDER_PATH));
  }

  return (
    <Sheet
      onClose={closeTicket}
      labelledBy="cart-sheet-title"
      width="sm"
      placement="bottom"
    >
      {(close) => (
        <>
          <header className="flex shrink-0 items-center justify-between border-b border-dashed border-border-subtle px-5 py-4">
            <div className="flex flex-col">
              <h2
                id="cart-sheet-title"
                className="font-heading text-lg font-bold text-foreground"
              >
                {dict.cart.title}
              </h2>
              <span className="tabular-nums text-xs font-semibold text-foreground/75">
                {pluralize(locale, dict.common.items, count)}
              </span>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label={dict.common.close}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <span className="icon-[mdi--close] text-xl" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <span className="icon-[mdi--cart] text-4xl text-foreground/20" />
                <p className="font-heading text-base font-bold text-foreground">
                  {dict.cart.empty}
                </p>
                <p className="max-w-xs text-sm text-foreground/75">
                  {dict.cart.emptyText}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-dashed divide-border-subtle">
                {lines.map((line) => (
                  <li key={line.key} className="flex gap-3 py-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-primary/10">
                      {line.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="icon-[mdi--food] text-xl text-primary/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2">
                        {/* dir="auto" : le nom vient du menu, en français.
                            Sur une page en arabe, le navigateur le lit
                            quand même de gauche à droite. */}
                        <p
                          dir="auto"
                          className="truncate font-heading text-sm font-bold text-foreground"
                        >
                          {line.name}
                        </p>
                        <span className="tabular-nums shrink-0 font-heading text-sm font-bold text-foreground">
                          {formatDA(getLineTotal(line), locale)}
                        </span>
                      </div>

                      {describeLineOptions(line, dict.common.without).map(
                        (detail, index) => (
                          <p
                            key={index}
                            className={`text-xs leading-snug ${DETAIL_CLASSES[detail.tone]}`}
                          >
                            {detail.label}
                          </p>
                        ),
                      )}

                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(line.key, line.quantity - 1)
                            }
                            aria-label={fill(dict.cart.removeOne, {
                              name: line.name,
                            })}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/75 transition-colors hover:bg-background hover:text-accent-bordeaux"
                          >
                            <span
                              className={`${
                                line.quantity === 1
                                  ? "icon-[mdi--trash-can-outline]"
                                  : "icon-[mdi--minus]"
                              } text-sm`}
                            />
                          </button>
                          <span className="tabular-nums w-6 text-center text-sm font-bold text-foreground">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(line.key, line.quantity + 1)
                            }
                            aria-label={fill(dict.cart.addOne, {
                              name: line.name,
                            })}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/75 transition-colors hover:bg-background hover:text-accent-green"
                          >
                            <span className="icon-[mdi--plus] text-sm" />
                          </button>
                        </div>

                        {/* Rouvre la fiche pré-remplie plutôt que d'obliger à
                            supprimer puis tout resaisir pour changer une sauce. */}
                        <button
                          type="button"
                          onClick={() => handleEdit(line)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground/75 transition-colors hover:bg-surface-2 hover:text-primary"
                        >
                          <span className="icon-[mdi--pencil-outline] text-sm" />
                          {dict.cart.edit}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          aria-label={fill(dict.cart.remove, {
                            name: line.name,
                          })}
                          className="ms-auto text-foreground/25 transition-colors hover:text-accent-bordeaux"
                        >
                          <span className="icon-[mdi--close] text-base" />
                        </button>
                      </div>

                      {line.quantity > 1 && (
                        <p className="tabular-nums text-xs text-foreground/40">
                          {fill(dict.common.perUnit, {
                            price: formatDA(getLineUnitPrice(line), locale),
                          })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length > 0 && (
            <footer
              className="ticket-notch relative shrink-0 border-t border-dashed border-border-subtle bg-background px-5 pt-4"
              style={{
                paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
                  {dict.common.total}
                </span>
                <span className="tabular-nums font-heading text-2xl font-bold text-accent-green">
                  {formatDA(total, locale)}
                </span>
              </div>

              {/* Depuis le tunnel lui-même, le ticket ne sert qu'à relire sa
                  commande : le seul geste utile est de repartir la modifier. */}
              {pathname === CHECKOUT_PATH ? (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    router.push(localizePath(locale, ORDER_PATH));
                  }}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-heading text-base font-bold text-on-primary transition-all hover:bg-accent-slate active:scale-[0.99]"
                >
                  {dict.cart.editOrder}
                  <span className="icon-[mdi--pencil-outline] text-lg" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    router.push(localizePath(locale, CHECKOUT_PATH));
                  }}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-heading text-base font-bold text-on-primary transition-all hover:bg-accent-slate active:scale-[0.99]"
                >
                  {dict.cart.checkout}
                  <span className="icon-[line-md--arrow-right-circle-twotone] text-xl rtl:-scale-x-100" />
                </button>
              )}

              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-foreground/45">
                  {dict.cart.nextStepHint}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    close();
                  }}
                  className="text-xs font-bold text-foreground/40 transition-colors hover:text-accent-bordeaux"
                >
                  {dict.cart.clear}
                </button>
              </div>
            </footer>
          )}
        </>
      )}
    </Sheet>
  );
}
