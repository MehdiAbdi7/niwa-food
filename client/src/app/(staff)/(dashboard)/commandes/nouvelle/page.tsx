"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MenuBrowser } from "@/components/orders/newOrder/MenuBrowser";
import { hasOptions } from "@/components/orders/newOrder/ProductGrid";
import { ProductConfigModal } from "@/components/orders/newOrder/ProductConfigModal";
import { TicketTotals } from "@/components/orders/newOrder/TicketTotals";
import { StaffPromoField } from "@/components/orders/newOrder/StaffPromoField";
import { useItemCart, getLineUnitPrice } from "@/components/orders/useItemCart";
import type { NewCartLine } from "@/components/orders/useItemCart";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateOrderMutation } from "@/features/orders/orderApi";
import { useGetTablesQuery } from "@/features/tables/tableApi";
import { useActiveStore } from "@/features/store/useActiveStore";
import { useAuth } from "@/features/auth/useAuth";
import { usePromoCode } from "@/features/publicOrder/usePromoCode";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDA } from "@/lib/format";
import { formatVariantLabel } from "@/lib/variantLabel";
import { ORDER_TYPE_ICONS, ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { STORE_LABELS, type Store } from "@/types/store";
import type { MenuItem } from "@/types/menuItem";
import type { CreateOrderPayload, OrderType } from "@/types/order";

const TYPE_OPTIONS: OrderType[] = ["dine_in", "takeaway", "delivery"];

export default function NewOrderPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { activeStore } = useActiveStore();
  const toast = useToast();
  const [isMobileTicketOpen, setIsMobileTicketOpen] = useState(false);

  const [type, setType] = useState<OrderType>("dine_in");
  const [manualStore, setManualStore] = useState<Store | "">("");
  const [tableId, setTableId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    cart,
    addLine,
    removeFromCart,
    setQuantity,
    toPayload,
    itemsCount,
    total,
  } = useItemCart();

  /**
   * Code promo au comptoir.
   *
   * Le client arrive avec son code sur son téléphone et commande en face de
   * l'employé : lui refuser la remise parce qu'il n'est pas passé par le site
   * n'aurait aucun sens. Le hook est EXACTEMENT celui du parcours client —
   * même vérification, même revalidation quand le panier ou le mode de service
   * change, donc aucun risque qu'un code passe ici et pas là.
   */
  const promo = usePromoCode({ itemsTotal: total, orderType: type });

  const discountAmount = promo.discountAmount;
  const payableTotal = Math.max(0, total - discountAmount);

  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);

  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  const impliedStore = activeStore ?? user?.store;
  const needsStoreSelector = isAdmin && !impliedStore;
  const resolvedStore = impliedStore ?? (manualStore || undefined);

  const { data: tables } = useGetTablesQuery(
    { store: resolvedStore },
    { skip: type !== "dine_in" || !resolvedStore },
  );

  const quantityByItem = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const line of cart) {
      counts[line.menuItemId] = (counts[line.menuItemId] ?? 0) + line.quantity;
    }

    return counts;
  }, [cart]);

  // Ajout direct si le produit n'a rien à configurer, sinon ouverture de la
  // modale d'options (variante, extras, retraits).
  function handleSelectProduct(item: MenuItem) {
    if (hasOptions(item)) {
      setConfiguringItem(item);
      return;
    }

    addLine({
      menuItemId: item._id,
      name: item.name,
      imageUrl: item.imageUrl,
      variant: item.variants[0],
      extras: [],
      excludedIngredients: [],
      quantity: 1,
    });
  }

  // Ajout d'un produit après configuration dans la modale.
  // On récupère ici l'image depuis le MenuItem original afin que
  // les produits configurés aient eux aussi leur image dans le ticket.
  function handleConfirmConfiguredLine(line: NewCartLine) {
    addLine({
      ...line,
      imageUrl: configuringItem?.imageUrl ?? line.imageUrl,
    });

    setConfiguringItem(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!fullName.trim()) {
      return setError("Le nom du client est requis");
    }

    if (cart.length === 0) {
      return setError("Ajoute au moins un article au panier");
    }

    if (type === "dine_in" && !tableId) {
      return setError("Choisis une table");
    }

    if (type !== "dine_in" && !resolvedStore) {
      return setError("Choisis un magasin");
    }

    if (type !== "dine_in" && phone.trim().length < 10) {
      return setError("Le téléphone est requis (10 chiffres minimum)");
    }

    if (type === "delivery" && !address.trim()) {
      return setError("L'adresse est requise pour une livraison");
    }

    const items = toPayload();
    // Le CODE seul, jamais le montant : le backend relit le pourcentage en
    // base et recalcule sur les prix qu'il a lui-même résolus.
    const promoCode = promo.applied?.code;
    let payload: CreateOrderPayload;

    if (type === "dine_in") {
      payload = {
        type: "dine_in",
        table: tableId,
        client: { fullName },
        remark: remark || undefined,
        promoCode,
        items,
      };
    } else if (type === "takeaway") {
      payload = {
        type: "takeaway",
        store: resolvedStore as Store,
        client: { fullName, phone },
        remark: remark || undefined,
        promoCode,
        items,
      };
    } else {
      payload = {
        type: "delivery",
        store: resolvedStore as Store,
        client: { fullName, phone, address },
        remark: remark || undefined,
        promoCode,
        items,
      };
    }

    try {
      const created = await createOrder(payload).unwrap();

      toast.success(`Commande #${created.dailyNumber} créée`);

      router.push("/commandes");
    } catch (err) {
      // Couvre aussi le 409 d'une table déjà ouverte avec un code promo : le
      // backend refuse d'ajouter une remise à une commande en cours, et son
      // message le dit en clair.
      setError(getApiErrorMessage(err, "Impossible de créer la commande"));
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-24 lg:pb-0">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        {/* ---------- Colonne menu ---------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/commandes"
              aria-label="Retour aux commandes"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground/75 transition-colors hover:border-primary hover:text-foreground"
            >
              <span className="icon-[mdi--arrow-left] text-xl" />
            </Link>

            <div>
              <h1 className="font-heading text-xl font-bold leading-tight text-foreground">
                Prise de commande
              </h1>

              <p className="text-sm text-foreground/75">
                Pour un client au comptoir ou au téléphone
              </p>
            </div>
          </div>

          <MenuBrowser
            quantityByItem={quantityByItem}
            onSelect={handleSelectProduct}
          />
        </div>

        {/* ---------- Ticket ----------
          max-h + colonne à trois zones : un élément sticky PLUS HAUT que le
          viewport se comporte comme un élément normal et défile avec la page —
          il fallait donc descendre jusqu'au bout de la grille produits pour
          atteindre « Envoyer en cuisine ». On plafonne la hauteur, seule la
          zone centrale défile, et le bouton reste toujours à l'écran.
          calc : 5rem = topbar sticky (top-20) + 1.5rem de respiration en bas.
          z-40 en mobile (feuille par-dessus la barre basse), mais lg:z-20 en
          desktop : sans ça le ticket recouvrait le menu déroulé de la topbar,
          le z-40 s'appliquant à toutes les tailles d'écran. */}
        <aside
          className={`${isMobileTicketOpen ? "flex" : "hidden"} fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] w-full flex-col overflow-y-auto lg:sticky lg:top-20 lg:z-20 lg:flex lg:max-h-[calc(100vh-5.5rem)] lg:w-88 lg:overflow-visible`}
        >
          <div className="ticket-notch surface-card relative flex flex-col p-5 pb-7 lg:max-h-[calc(100vh-5.5rem)]">
            <button
              type="button"
              onClick={() => setIsMobileTicketOpen(false)}
              aria-label="Fermer le ticket"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground/75 hover:text-foreground lg:hidden"
            >
              <span className="icon-[mdi--close] text-lg" />
            </button>
            {/* Zone défilante : entête, formulaire et lignes du ticket. */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
              <div className="flex items-baseline justify-between pr-12">
                <h2 className="font-heading text-base font-bold text-foreground">
                  Ticket
                </h2>

                <span className="tabular-nums text-xs font-semibold text-foreground/75">
                  {itemsCount} article
                  {itemsCount > 1 ? "s" : ""}
                </span>
              </div>

              {/* Type de commande */}
              <div className="grid grid-cols-3 gap-1.5">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-bold transition-colors ${
                      type === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-subtle text-foreground/75 hover:text-foreground"
                    }`}
                  >
                    <span className={`${ORDER_TYPE_ICONS[t]} text-lg`} />

                    {ORDER_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {needsStoreSelector && (
                  <Select
                    id="store"
                    label="Magasin"
                    value={manualStore}
                    onChange={(e) => {
                      setManualStore(e.target.value as Store);
                      setTableId("");
                    }}
                    placeholder="Choisir un magasin"
                    options={Object.entries(STORE_LABELS).map(
                      ([value, label]) => ({
                        value,
                        label,
                      }),
                    )}
                  />
                )}

                {type === "dine_in" && (
                  <Select
                    id="table"
                    label="Table"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    placeholder={
                      resolvedStore
                        ? "Choisir une table"
                        : "Choisis d'abord un magasin"
                    }
                    disabled={!resolvedStore}
                    options={(tables ?? [])
                      .slice()
                      .sort((a, b) => a.tableN - b.tableN)
                      .map((t) => ({
                        value: t._id,
                        label: `Table ${t.tableN} — ${
                          t.status === "occupied" ? "occupée" : "libre"
                        }`,
                      }))}
                  />
                )}

                <Input
                  id="fullName"
                  label="Nom du client"
                  placeholder="Ex : Yacine"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                {type !== "dine_in" && (
                  <Input
                    id="phone"
                    label="Téléphone"
                    placeholder="05 00 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                )}

                {type === "delivery" && (
                  <Input
                    id="address"
                    label="Adresse"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                )}

                <Input
                  id="remark"
                  label="Remarque"
                  placeholder="Sans oignons, bien cuit..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />

                {/* Après les coordonnées, avant les lignes : c'est le dernier
                    élément d'identification du client, et il se saisit une
                    seule fois pour toute la commande. */}
                <StaffPromoField promo={promo} />

                {/* La fusion sur une table occupée refuse tout code promo côté
                    backend (409) : mieux vaut le dire avant l'envoi que de
                    laisser l'employé rejouer la commande. */}
                {type === "dine_in" &&
                  promo.applied &&
                  tables?.find((t) => t._id === tableId)?.status ===
                    "occupied" && (
                    <p className="rounded-lg bg-accent-mustard/10 px-3 py-2 text-xs text-foreground/75">
                      Cette table a déjà une commande ouverte : les articles y
                      seront ajoutés, et le code promo sera refusé. Termine
                      d&apos;abord la commande en cours.
                    </p>
                  )}
              </div>

              {/* Lignes du ticket */}
              <div className="flex flex-col gap-2.5 border-t border-dashed border-border-subtle pt-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                    <span className="icon-[mdi--receipt-text-plus-outline] text-2xl text-foreground/25" />

                    <p className="text-sm font-semibold text-foreground/75">
                      Ticket vide
                    </p>

                    <p className="text-xs text-foreground/40">
                      Touche un produit pour l&apos;ajouter
                    </p>
                  </div>
                ) : (
                  cart.map((line) => {
                    const variantLabel = formatVariantLabel(
                      line.variant.combination,
                    );

                    return (
                      <div key={line.key} className="flex items-center gap-2.5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                          {line.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={line.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <span className="icon-[mdi--food] text-base text-foreground/30" />
                            </div>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="truncate text-xs font-bold text-foreground">
                            {line.name}
                          </p>

                          <p className="tabular-nums text-xs text-foreground/75">
                            {variantLabel !== "Standard"
                              ? `${variantLabel} · `
                              : ""}
                            {formatDA(getLineUnitPrice(line))}
                          </p>

                          {/* La cuisine doit voir les options sur le ticket,
                            pas seulement leur effet sur le prix. */}
                          {line.extras.length > 0 && (
                            <p className="truncate text-xs text-accent-green">
                              +{" "}
                              {line.extras
                                .map((extra) => extra.name)
                                .join(", ")}
                            </p>
                          )}

                          {line.excludedIngredients.length > 0 && (
                            <p className="truncate text-xs text-accent-bordeaux">
                              sans {line.excludedIngredients.join(", ")}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-surface-2 p-0.5">
                          <button
                            onClick={() =>
                              setQuantity(line.key, line.quantity - 1)
                            }
                            aria-label={`Retirer un ${line.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/75 hover:bg-surface hover:text-accent-bordeaux"
                          >
                            <span className="icon-[mdi--minus] text-sm" />
                          </button>

                          <span className="tabular-nums w-5 text-center text-xs font-bold text-foreground">
                            {line.quantity}
                          </span>

                          <button
                            onClick={() =>
                              setQuantity(line.key, line.quantity + 1)
                            }
                            aria-label={`Ajouter un ${line.name}`}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/75 hover:bg-surface hover:text-accent-green"
                          >
                            <span className="icon-[mdi--plus] text-sm" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(line.key)}
                          aria-label={`Supprimer ${line.name} du ticket`}
                          className="shrink-0 text-foreground/25 hover:text-accent-bordeaux"
                        >
                          <span className="icon-[mdi--close] text-base" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Zone figée : totaux et action. shrink-0 empêche le flex parent de
              la comprimer quand le ticket se remplit — sans lui, le bouton
              s'écraserait progressivement à mesure qu'on ajoute des articles. */}
            <div className="flex shrink-0 flex-col gap-4 pt-4">
              <TicketTotals
                itemsTotal={total}
                itemsCount={itemsCount}
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

              {type === "delivery" && (
                <p className="-mt-2 text-xs text-foreground/45">
                  Les frais de livraison seront ajoutés depuis la fiche
                  commande.
                  {discountAmount > 0 &&
                    " La remise ne s'applique pas à la livraison."}
                </p>
              )}

              {error && (
                <p className="rounded-lg bg-accent-bordeaux/10 px-3 py-2 text-sm text-accent-bordeaux">
                  {error}
                </p>
              )}

              <Button
                size="lg"
                icon="icon-[mdi--check-circle-outline]"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={cart.length === 0}
                className="w-full"
              >
                Envoyer en cuisine
              </Button>
            </div>
          </div>
        </aside>

        <ProductConfigModal
          item={configuringItem}
          onClose={() => setConfiguringItem(null)}
          onConfirm={handleConfirmConfiguredLine}
        />
      </div>

      {isMobileTicketOpen && (
        <button
          type="button"
          aria-label="Fermer le ticket"
          onClick={() => setIsMobileTicketOpen(false)}
          className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <button
        type="button"
        onClick={() => setIsMobileTicketOpen(true)}
        className={`${isMobileTicketOpen ? "hidden" : "flex"} fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 min-h-14 items-center justify-between rounded-2xl bg-primary px-4 py-2.5 text-left text-on-primary shadow-[0_8px_24px_rgba(61,39,22,0.3)] transition-transform active:scale-[0.98] lg:hidden`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-on-primary/15">
            <span className="icon-[mdi--receipt-text-outline] text-xl" />
          </span>
          <span className="flex flex-col">
            <span className="text-xs font-semibold text-on-primary/75">
              Votre ticket
            </span>
            <span className="font-heading text-sm font-bold">
              {itemsCount} article{itemsCount > 1 ? "s" : ""}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2 font-heading font-bold">
          {/* Montant APRÈS remise : c'est ce que l'employé va annoncer au
              client, la barre repliée ne doit pas afficher autre chose. */}
          {formatDA(payableTotal)}
          <span className="icon-[mdi--chevron-up] text-xl" />
        </span>
      </button>
    </div>
  );
}
