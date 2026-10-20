"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckoutSummary } from "./CheckoutSummary";
import { PromoCodeField } from "./PromoCodeField";
import { useCart } from "@/features/publicOrder/useCart";
import { usePromoCode } from "@/features/publicOrder/usePromoCode";
import {
  useGetPublicTablesQuery,
  useCreatePublicOrderMutation,
} from "@/features/publicOrder/publicOrderApi";
import { useStoreStatuses } from "@/features/storeSettings/useStoreStatuses";
import { useOrderContext } from "@/features/orders/useOrderContext";
import { toOrderItemsPayload } from "@/lib/cartLine";
import { writeLastOrder } from "@/lib/lastOrder";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDA } from "@/lib/format";
import { DEMO_MODE } from "@/config/site";
import { ORDER_TYPE_ICONS } from "@/lib/orderLabels";
import { STORES, type Store } from "@/types/store";
import type { CreateOrderPayload, OrderType } from "@/types/order";
import { useI18n } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/config";
import { fill } from "@/i18n/text";

const TYPE_OPTIONS: OrderType[] = ["dine_in", "takeaway", "delivery"];

interface CheckoutFormProps {
  /** IDs des produits encore commandables, résolus côté serveur. */
  availableItemIds: string[];
}

/* ---------- Champs, au style du site public ---------- */
// Volontairement locaux et non components/ui/Input : ces composants-là sont
// calibrés pour le dashboard (bg-surface, angles serrés). La carte publique a
// sa propre grammaire — champs hauts, bordures primary, cibles tactiles larges.

function Label({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  const { dict } = useI18n();

  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline gap-2 font-heading text-sm font-bold text-foreground"
    >
      {children}
      {optional && (
        <span className="text-xs font-semibold text-foreground/40">
          {dict.common.optional}
        </span>
      )}
    </label>
  );
}

// bg-background/85 et non bg-background : le fond fixe doit rester perceptible
// derrière les champs, sinon la page ressemble à un formulaire posé sur une
// image plutôt qu'à un écran unifié.
const FIELD_CLASSES =
  "h-12 w-full rounded-xl border border-primary/25 bg-background/85 px-4 text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary";

function LoadingScreen() {
  return (
    <div className="relative z-10 flex min-h-[60vh] items-center justify-center">
      <span
        aria-hidden="true"
        className="icon-[mdi--loading] animate-spin text-4xl text-primary"
      />
    </div>
  );
}

export function CheckoutForm({ availableItemIds }: CheckoutFormProps) {
  const router = useRouter();
  const { locale, dict } = useI18n();
  const texts = dict.checkout;
  const { store: contextStore, tableId: contextTable } = useOrderContext();

  const { lines, total, count, isHydrated, reconcile, clear } = useCart();

  const { isAccepting, getClosedMessage, allClosed } = useStoreStatuses();

  const [createOrder, { isLoading: isSubmitting }] =
    useCreatePublicOrderMutation();

  /**
   * Faux pendant le rendu serveur ET pendant l'hydratation.
   *
   * Sans ce garde, le branchement sur `isHydrated` casse l'hydratation :
   * CartHydrator est monté par le layout public, donc AU-DESSUS de cette page,
   * et son effet dispatche `cartRestored` avant que React n'hydrate ce
   * composant. Le serveur a rendu le spinner (store vide), le client rendrait
   * déjà le formulaire (store rempli) — les deux arbres divergent.
   *
   * Avec ce drapeau, le premier rendu client reproduit le HTML serveur à
   * l'identique, et le formulaire n'apparaît qu'au rendu suivant.
   */
  const [isMounted, setIsMounted] = useState(false);

  // Le rendu supplémentaire est précisément l'objectif : il sépare le rendu
  // d'hydratation (identique au HTML serveur) du rendu suivant, où le panier
  // restauré peut enfin être pris en compte.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Le QR ne porte rien aujourd'hui (generateQRCode.ts produit un /commande
  // nu), mais si un jour tu passes à un QR par table, le contexte pré-remplit
  // ces deux champs et le client n'a plus qu'à donner son nom.
  const [type, setType] = useState<OrderType>(
    contextTable ? "dine_in" : "dine_in",
  );
  const [store, setStore] = useState<Store | null>(contextStore);
  const [tableId, setTableId] = useState(contextTable ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Code promo.
   *
   * Déclaré APRÈS `type` et `total` : le hook les revérifie à chaque
   * changement, pour qu'un code réservé à la livraison saute dès que le client
   * bascule sur « à emporter », et qu'un code à partir de 2 000 DA saute s'il
   * retire un article. Sans ça, le refus n'arriverait qu'à l'envoi.
   */
  const promo = usePromoCode({
    itemsTotal: total,
    orderType: type,
    messages: dict.promo.errors,
  });

  const discountAmount = promo.discountAmount;
  const payableTotal = Math.max(0, total - discountAmount);

  // Sans ce drapeau, le clear() qui suit l'envoi viderait le panier, l'effet
  // ci-dessous verrait lines.length === 0 et renverrait vers /commande avant
  // que la navigation vers le suivi n'aboutisse.
  const hasSubmitted = useRef(false);

  const { data: tables, isLoading: isLoadingTables } = useGetPublicTablesQuery(
    { store: store as Store },
    { skip: type !== "dine_in" || !store },
  );

  // Deuxième passe de réconciliation : un produit peut avoir été retiré du
  // menu entre la carte et cet écran. Mieux vaut le voir ici qu'au 404 du POST.
  useEffect(() => {
    if (!isHydrated) return;
    reconcile(availableItemIds);
    // reconcile est recréé à chaque rendu et le reducer est idempotent :
    // le sortir des dépendances évite une boucle sans rien changer au résultat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, availableItemIds]);

  // Panier vide = rien à finaliser. La garde attend l'hydratation, sinon elle
  // renverrait systématiquement à la carte au premier rendu.
  useEffect(() => {
    if (!isHydrated || hasSubmitted.current) return;
    if (lines.length === 0) router.replace(localizePath(locale, "/commande"));
  }, [isHydrated, lines.length, router, locale]);

  // Le magasin choisi ne prend plus de commandes. Le backend renverrait un 503
  // de toute façon (c'est lui qui fait foi), mais le client doit le voir avant
  // d'avoir rempli son adresse, pas après avoir appuyé sur « Envoyer ».
  const isSelectedStoreClosed = store !== null && !isAccepting(store);

  function selectStore(next: Store) {
    setStore(next);
    // La liste des tables dépend du magasin : garder l'ancienne sélection
    // enverrait un ObjectId appartenant à l'autre restaurant.
    setTableId("");
    setError(null);
  }

  function validate(): string | null {
    if (!store) return texts.errors.store;
    // En premier après le magasin : inutile de reprocher un téléphone manquant
    // à quelqu'un dont la commande sera refusée quoi qu'il arrive.
    if (!isAccepting(store)) return getClosedMessage(store);
    if (!fullName.trim()) return texts.errors.name;
    if (type === "dine_in" && !tableId) return texts.errors.table;
    if (type !== "dine_in" && phone.trim().length < 10) {
      return texts.errors.phone;
    }
    if (type === "delivery" && !address.trim()) {
      return texts.errors.address;
    }
    return null;
  }

  async function handleSubmit() {
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const items = toOrderItemsPayload(lines);
    // Le CODE seul part au serveur, jamais le montant : c'est resolvePromoCode
    // qui relit le pourcentage en base et recalcule la remise sur les prix
    // qu'il a lui-même résolus.
    const promoCode = promo.applied?.code;
    let payload: CreateOrderPayload;

    if (type === "dine_in") {
      // Pas de `store` ici : le backend le dérive de la table, précisément
      // pour qu'un client ne puisse pas le falsifier.
      payload = {
        type: "dine_in",
        table: tableId,
        client: { fullName: fullName.trim() },
        remark: remark.trim() || undefined,
        promoCode,
        items,
      };
    } else if (type === "takeaway") {
      payload = {
        type: "takeaway",
        store: store as Store,
        client: { fullName: fullName.trim(), phone: phone.trim() },
        remark: remark.trim() || undefined,
        promoCode,
        items,
      };
    } else {
      payload = {
        type: "delivery",
        store: store as Store,
        client: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        remark: remark.trim() || undefined,
        promoCode,
        items,
      };
    }

    try {
      // Cas particulier : si la table portait déjà une commande active, le
      // backend fusionne et renvoie CETTE commande (200, pas 201). L'_id reçu
      // est alors celui de la commande existante — c'est voulu, le client
      // suivra bien le ticket qui sortira en cuisine.
      //
      // Un code promo est REFUSÉ dans ce cas de figure (409) : il remiserait
      // aussi les articles déjà commandés par quelqu'un d'autre à la table.
      const created = await createOrder(payload).unwrap();

      hasSubmitted.current = true;
      writeLastOrder(created._id, created.dailyNumber);
      clear();

      router.replace(localizePath(locale, `/commande/suivi/${created._id}`));
    } catch (err) {
      // Couvre aussi le 503 d'un magasin fermé entre l'affichage et l'envoi :
      // errorResponse renvoie { error }, donc le message du restaurant remonte
      // tel quel, sans traitement particulier à ajouter ici.
      //
      // Et le cas de course sur un code à usages limités : deux clients sur le
      // dernier usage, l'un des deux reçoit un 409. Le code n'est PAS retiré
      // automatiquement — deviner à quoi se rapporte une erreur à partir de son
      // texte est fragile. Le client garde la main via le × du champ, et
      // l'indication ci-dessous le lui rappelle.
      setError(getApiErrorMessage(err, texts.errors.send));
    }
  }

  // Écran d'attente le temps que le panier soit relu du disque : afficher le
  // formulaire puis le faire disparaître serait plus déroutant.
  // isMounted en premier : voir plus haut, c'est ce qui garantit que le
  // premier rendu client est identique au HTML serveur.
  if (!isMounted || !isHydrated || lines.length === 0) {
    return <LoadingScreen />;
  }

  return (
    // relative z-10 obligatoire : FixedBackground est en z-0, donc positionné,
    // donc peint APRÈS les fonds des éléments non positionnés. Sans cette
    // remontée, tout le formulaire passerait derrière le motif.
    //
    // pb-16 et non pb-32 : le bouton n'est plus flottant, il n'y a plus de
    // hauteur à réserver sous le contenu.
    <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-16 pt-28">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href={localizePath(locale, "/commande")}
          aria-label={dict.common.backToMenu}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background/60 text-foreground/75 backdrop-blur-sm transition-colors hover:border-primary hover:text-foreground"
        >
          {/* Le retour pointe vers le début de la lecture : à droite en arabe. */}
          <span
            aria-hidden="true"
            className="icon-[mdi--arrow-left] text-xl rtl:-scale-x-100"
          />
        </Link>

        <div>
          <span className="font-heading text-xs font-bold uppercase tracking-wide text-accent-green">
            {texts.lastStep}
          </span>
          <h1 className="font-heading text-2xl font-bold leading-tight text-foreground">
            {texts.title}
          </h1>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <CheckoutSummary
          lines={lines}
          total={total}
          count={count}
          discount={
            promo.applied
              ? {
                  code: promo.applied.code,
                  percent: promo.applied.discountPercent,
                  amount: discountAmount,
                }
              : null
          }
        />

        {/* Juste sous le récapitulatif : c'est là que le client regarde son
            montant, donc là qu'il pense à son code. Plus bas, entre l'adresse
            et le bouton, il ne le verrait qu'après avoir tout rempli. */}
        <PromoCodeField promo={promo} />

        {/* Tout est fermé : on le dit une bonne fois en haut du formulaire,
            plutôt que de laisser le client buter sur deux boutons grisés sans
            comprendre lequel des deux est en cause. */}
        {allClosed && (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-2xl border border-accent-bordeaux/40 bg-accent-bordeaux/10 px-4 py-4 backdrop-blur-sm"
          >
            <p className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
              <span
                aria-hidden="true"
                className="icon-[mdi--store-clock-outline] text-lg text-accent-bordeaux"
              />
              {texts.closedTitle}
            </p>
            <p className="text-sm text-foreground/70">{texts.closedText}</p>
            <Link
              href={localizePath(locale, "/#contact")}
              className="text-sm font-bold text-accent-bordeaux underline"
            >
              {dict.common.seeNumbers}
            </Link>
          </div>
        )}

        {/* ---------- Restaurant ---------- */}
        {/* En premier, et pas par hasard : la liste des tables en dépend, et
            les commandes à emporter comme en livraison exigent un magasin
            explicite côté backend. */}
        <section className="flex flex-col gap-2.5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
            {dict.common.whichStore}
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {STORES.map((option) => {
              const isClosed = !isAccepting(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectStore(option)}
                  // Désactivé plutôt que masqué : un client habitué doit voir
                  // que Chéraga existe et qu'il est fermé, pas croire qu'on a
                  // supprimé l'adresse.
                  disabled={isClosed}
                  aria-pressed={store === option}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border font-heading text-sm font-bold backdrop-blur-sm transition-colors ${
                    isClosed
                      ? "cursor-not-allowed border-primary/15 bg-background/40 text-foreground/35"
                      : store === option
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-primary/25 bg-background/60 text-foreground/70 hover:border-primary/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`text-lg ${
                        isClosed
                          ? "icon-[mdi--store-off-outline]"
                          : "icon-[mdi--map-marker]"
                      }`}
                    />
                    {dict.stores[option].name}
                  </span>
                  {isClosed && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent-bordeaux/70">
                      {dict.common.closed}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cas du QR : le magasin était pré-sélectionné, et il vient de
              fermer. Sans ce message, le bouton d'envoi serait grisé sans
              qu'aucun des deux boutons ci-dessus ne paraisse sélectionné. */}
          {isSelectedStoreClosed && !allClosed && (
            <p className="rounded-xl bg-accent-bordeaux/10 px-4 py-3 text-sm text-accent-bordeaux backdrop-blur-sm">
              {getClosedMessage(store)} {texts.chooseOtherStore}
            </p>
          )}
        </section>

        {/* ---------- Mode ---------- */}
        <section className="flex flex-col gap-2.5">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
            {texts.serviceTitle}
          </h2>

          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                aria-pressed={type === option}
                className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold backdrop-blur-sm transition-colors ${
                  type === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary/25 bg-background/60 text-foreground/70 hover:border-primary/50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`${ORDER_TYPE_ICONS[option]} text-2xl`}
                />
                {dict.orderTypes[option]}
              </button>
            ))}
          </div>

          <p className="text-xs text-foreground/75">{texts.hints[type]}</p>
        </section>

        {/* ---------- Coordonnées ---------- */}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
            {texts.infoTitle}
          </h2>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">{texts.name}</Label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={texts.namePlaceholder}
              className={FIELD_CLASSES}
            />
            <p className="text-xs text-foreground/45">{texts.nameHint}</p>
          </div>

          {type === "dine_in" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="table">{texts.table}</Label>

              {!store ? (
                <p className="rounded-xl bg-background/70 px-4 py-3 text-sm text-foreground/75 backdrop-blur-sm">
                  {texts.chooseStoreFirst}
                </p>
              ) : isLoadingTables ? (
                <p className="rounded-xl bg-background/70 px-4 py-3 text-sm text-foreground/75 backdrop-blur-sm">
                  {texts.loadingTables}
                </p>
              ) : !tables || tables.length === 0 ? (
                <p className="rounded-xl bg-accent-bordeaux/10 px-4 py-3 text-sm text-accent-bordeaux backdrop-blur-sm">
                  {texts.noTables}
                </p>
              ) : (
                <>
                  <select
                    id="table"
                    value={tableId}
                    onChange={(event) => setTableId(event.target.value)}
                    className={`${FIELD_CLASSES} appearance-none`}
                  >
                    <option value="" disabled>
                      {texts.chooseTable}
                    </option>
                    {[...tables]
                      .sort((a, b) => a.tableN - b.tableN)
                      .map((table) => (
                        <option key={table._id} value={table._id}>
                          {fill(texts.tableOption, { number: table.tableN })}
                          {table.status === "occupied" ? texts.occupied : ""}
                        </option>
                      ))}
                  </select>

                  {/* Le backend fusionne silencieusement avec la commande en
                      cours d'une table occupée. C'est le comportement voulu
                      pour un groupe qui commande en deux fois, mais il doit
                      être annoncé — sinon le client croit avoir sa propre
                      commande et se retrouve sur le ticket d'inconnus.
                      Et un code promo y est refusé : autant le dire ici. */}
                  {tableId &&
                    tables.find((table) => table._id === tableId)?.status ===
                      "occupied" && (
                      <p className="flex items-start gap-2 rounded-xl bg-accent-mustard/10 px-3 py-2 text-xs text-foreground/75 backdrop-blur-sm">
                        <span
                          aria-hidden="true"
                          className="icon-[mdi--information-outline] mt-0.5 shrink-0 text-sm text-accent-mustard"
                        />
                        <span>
                          {texts.tableBusy}
                          {promo.applied && texts.promoOnBusyTable}
                        </span>
                      </p>
                    )}
                </>
              )}
            </div>
          )}

          {type !== "dine_in" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">{texts.phone}</Label>
              {/* dir="ltr" : un numéro se tape de gauche à droite, même
                  sur une page en arabe. */}
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="05 00 00 00 00"
                className={`${FIELD_CLASSES} rtl:text-right`}
              />
              <p className="text-xs text-foreground/45">{texts.phoneHint}</p>
            </div>
          )}

          {type === "delivery" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">{texts.address}</Label>
              <textarea
                id="address"
                rows={2}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={texts.addressPlaceholder}
                className="w-full rounded-xl border border-primary/25 bg-background/85 px-4 py-3 text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="remark" optional>
              {texts.remark}
            </Label>
            <input
              id="remark"
              type="text"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder={texts.remarkPlaceholder}
              className={FIELD_CLASSES}
            />
          </div>
        </section>

        {type === "delivery" && (
          <p className="flex items-start gap-2 rounded-xl bg-background/70 px-4 py-3 text-xs text-foreground/75 backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="icon-[mdi--moped-outline] mt-0.5 shrink-0 text-base text-primary"
            />
            <span>
              {texts.deliveryFees}
              {discountAmount > 0 && texts.discountNotOnDelivery}
            </span>
          </p>
        )}

        {/* ---------- Envoi ---------- */}
        {/* En flux normal, en fin de formulaire. Le message d'erreur est
            remonté ICI, juste au-dessus du bouton : un client qui clique en bas
            de page doit voir immédiatement ce qui bloque. */}
        <section className="flex flex-col gap-3 border-t border-dashed border-primary/25 pt-6">
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-1 rounded-xl bg-accent-bordeaux/10 px-4 py-3 backdrop-blur-sm"
            >
              <p className="text-sm font-semibold text-accent-bordeaux">
                {error}
              </p>
              {promo.applied && (
                <p className="text-xs text-foreground/75">{texts.promoHint}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            // Désactivé sur un magasin fermé plutôt que de laisser partir une
            // requête qu'on sait condamnée au 503.
            disabled={isSubmitting || isSelectedStoreClosed || allClosed}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 font-heading text-base font-bold text-on-primary transition-all hover:bg-accent-slate active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
          >
            {isSubmitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="icon-[mdi--loading] animate-spin text-xl"
                />
                {texts.sending}
              </>
            ) : isSelectedStoreClosed || allClosed ? (
              texts.closedButton
            ) : (
              <>
                {texts.send}
                {/* Le montant affiché est celui APRÈS remise : c'est ce que le
                    client va payer, et c'est le seul chiffre qui l'intéresse
                    au moment d'appuyer. */}
                <span className="tabular-nums">
                  · {formatDA(payableTotal, locale)}
                </span>
              </>
            )}
          </button>

          {/* En démo, la promesse « part en cuisine » serait fausse : la
              commande arrive dans le back-office de démonstration, personne
              ne la prépare. Le client doit le lire AVANT d'appuyer. */}
          {DEMO_MODE ? (
            <p className="text-center text-xs font-semibold text-foreground/75">
              {texts.demoNotice}
            </p>
          ) : (
            <p className="text-center text-xs text-foreground/45">
              {texts.liveNotice}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
