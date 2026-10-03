"use client";

import { useEffect, useMemo } from "react";
import { DishCard, hasChoices } from "./DishCard";
import { ProductSheet } from "./ProductSheet";
import { useCart } from "@/features/publicOrder/useCart";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  activeAnchorChanged,
  filtersReset,
  selectSearch,
} from "@/features/publicOrder/browseSlice";
import { selectProductSheet } from "@/features/publicOrder/cartSlice";
import {
  buildMenuSections,
  buildSpyAnchors,
  sortMenuItems,
  subAnchorId,
} from "@/features/publicOrder/menuBlocks";
import { useSectionSpy } from "@/features/publicOrder/useSectionSpy";
import type { MenuNavGroup } from "@/features/menu/menuNav";
import type { MenuItem } from "@/types/menuItem";

interface DishListProps {
  items: MenuItem[]; // déjà filtrés "disponibles" côté serveur
  nav: MenuNavGroup[];
}

// Décalage réservé sous la barre de navigation fixe et, sur mobile, sous le
// bandeau de filtres collant. Sans lui, un titre visé par une ancre se range
// DERRIÈRE ces deux barres et le client croit avoir atterri au mauvais endroit.
// Sur lg, le bandeau devient une colonne latérale : seule la navbar compte.
const ANCHOR_OFFSET = "scroll-mt-52 lg:scroll-mt-28";

function SectionTitle({
  id,
  label,
  count,
}: {
  id: string;
  label: string;
  count: number;
}) {
  return (
    <>
      {/* L'ancre est un repère de hauteur nulle, POSÉ AVANT le titre et non
          sur lui. Un élément sticky rapporte sa position collée, pas sa
          position dans le flux : quand on est déjà dans la section, son titre
          est figé à 80px du haut, scrollIntoView en déduit qu'on y est et ne
          défile pas. Le repère, lui, reste où il est vraiment. */}
      <span
        id={id}
        aria-hidden="true"
        className={`block h-0 ${ANCHOR_OFFSET}`}
      />

      {/* Collant à partir de lg uniquement. Sur mobile, le bandeau de filtres
          occupe déjà le haut de l'écran : empiler un second élément collant
          mangerait un tiers de la hauteur utile d'un téléphone. */}
      <div className="lg:sticky lg:top-20 lg:z-20">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-background/85 px-4 py-2.5 backdrop-blur-xl dark:bg-primary/15">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {label}
          </h2>
          {/* accent-mustard-text et non primary : en sombre, le doré primary
              sur sa propre teinte (bg-primary/15) plafonnait à 3,5:1. */}
          <span className="tabular-nums rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-accent-mustard-text">
            {count}
          </span>
          {/* Filet doré qui s'éteint vers la droite : reprend la lumière des
              cadres de la page d'accueil, sans en ajouter une de plus. */}
          <span
            aria-hidden="true"
            className="h-px flex-1 bg-linear-to-r from-primary/50 to-transparent"
          />
        </div>
      </div>
    </>
  );
}

/**
 * Grille des plats, et hôte de la fiche produit.
 *
 * La carte s'affiche EN ENTIER, découpée en sections : plus de filtrage qui
 * masque 30 plats sur 35. Choisir une catégorie fait défiler jusqu'à elle, et
 * la colonne de gauche suit le scroll — le client sait toujours où il est, et
 * tombe sur des produits qu'il n'aurait pas pensé à chercher.
 *
 * La fiche vit ici et non dans un composant frère : c'est le seul endroit qui
 * détient déjà le menu complet. L'isoler ailleurs obligerait à sérialiser une
 * deuxième fois tout le catalogue dans le payload RSC.
 */
export function DishList({ items, nav }: DishListProps) {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);
  const sheet = useAppSelector(selectProductSheet);

  const {
    quantityByItem,
    lines,
    addLine,
    openProduct,
    closeProduct,
    isHydrated,
    reconcile,
    unavailableNotice,
    dismissNotice,
  } = useCart();

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  // Chaîne primitive et non tableau : la référence d'un tableau change à
  // chaque rendu, ce qui relancerait l'effet en boucle.
  const availableIdsKey = useMemo(
    () => items.map((item) => item._id).join(","),
    [items],
  );

  useEffect(() => {
    // Avant l'hydratation il n'y a rien à réconcilier, et le faire trop tôt
    // reviendrait à valider un panier vide.
    if (!isHydrated) return;
    reconcile(availableIdsKey ? availableIdsKey.split(",") : []);
    // reconcile est recréé à chaque rendu (useCart n'est pas mémoïsé) : le
    // sortir des dépendances évite la boucle, et le reducer est de toute
    // façon idempotent — il ne modifie l'état que s'il y a vraiment à retirer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, availableIdsKey]);

  // Options de formule (la boisson d'un menu) lues dans le menu réel plutôt
  // qu'une liste figée : ajouter une canette suffit à la proposer en formule.
  const optionsByCategory = useMemo(() => {
    const options: Record<string, string[]> = {};

    for (const item of items) {
      const categoryName =
        typeof item.category === "object" ? item.category?.name : undefined;
      if (!categoryName) continue;
      (options[categoryName] ??= []).push(item.name);
    }

    for (const list of Object.values(options)) {
      list.sort((a, b) => a.localeCompare(b, "fr"));
    }

    return options;
  }, [items]);

  const sections = useMemo(() => buildMenuSections(nav, items), [nav, items]);
  const anchors = useMemo(() => buildSpyAnchors(sections), [sections]);

  // La recherche couvre la description : on retrouve souvent un plat par un
  // ingrédient dont on a oublié le nom.
  const results = useMemo(() => {
    if (!isSearching) return [];
    return sortMenuItems(
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      ),
    );
  }, [items, query, isSearching]);

  useSectionSpy(
    anchors,
    (anchor) =>
      dispatch(
        activeAnchorChanged({ group: anchor.group, subKey: anchor.subKey }),
      ),
    !isSearching,
  );

  // Pendant une recherche, il n'y a plus de section à désigner : laisser une
  // catégorie allumée ferait croire à un filtre encore actif.
  useEffect(() => {
    if (isSearching) {
      dispatch(activeAnchorChanged({ group: null, subKey: null }));
    }
  }, [isSearching, dispatch]);

  const configuredItem = sheet
    ? (items.find((item) => item._id === sheet.menuItemId) ?? null)
    : null;

  const editedLine = sheet?.lineKey
    ? (lines.find((line) => line.key === sheet.lineKey) ?? null)
    : null;

  function handleSelect(item: MenuItem) {
    // Rien à composer (une canette, une salade) : au panier en un geste, sans
    // imposer un écran de plus.
    if (!hasChoices(item)) {
      addLine({
        menuItemId: item._id,
        name: item.name,
        imageUrl: item.imageUrl,
        variant: item.variants[0],
        extras: [],
        excludedIngredients: [],
        quantity: 1,
      });
      return;
    }

    openProduct(item._id);
  }

  function renderCard(item: MenuItem) {
    return (
      <DishCard
        key={item._id}
        item={item}
        inCart={quantityByItem[item._id] ?? 0}
        onSelect={handleSelect}
      />
    );
  }

  return (
    <>
      {/* Un article disparu en silence serait pire que pas de panier persisté
          du tout : le client doit savoir pourquoi son total a baissé. */}
      {unavailableNotice.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-accent-mustard/40 bg-accent-mustard/10 px-4 py-3 backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="icon-[mdi--information-outline] mt-0.5 shrink-0 text-lg text-accent-mustard"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-heading text-sm font-bold text-foreground">
              {unavailableNotice.length > 1
                ? "Des articles ne sont plus disponibles"
                : "Un article n'est plus disponible"}
            </p>
            <p className="text-sm text-foreground/75">
              {unavailableNotice.join(", ")} — retiré
              {unavailableNotice.length > 1 ? "s" : ""} de votre panier.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissNotice}
            aria-label="Fermer"
            className="shrink-0 text-foreground/40 transition-colors hover:text-foreground"
          >
            <span aria-hidden="true" className="icon-[mdi--close] text-lg" />
          </button>
        </div>
      )}

      {isSearching ? (
        results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <span
              aria-hidden="true"
              className="icon-[mdi--silverware-clean] text-4xl text-foreground/25"
            />
            <p className="font-heading text-lg font-bold text-foreground">
              Rien ne correspond
            </p>
            <p className="max-w-xs text-sm text-foreground/75">
              Essayez un autre ingrédient, ou effacez la recherche pour
              parcourir toute la carte.
            </p>
            <button
              type="button"
              onClick={() => dispatch(filtersReset())}
              className="mt-2 rounded-full border border-primary px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Revoir tout le menu
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-foreground/75">
              <span className="tabular-nums font-bold text-foreground">
                {results.length}
              </span>{" "}
              plat{results.length > 1 ? "s" : ""} pour «&nbsp;{search.trim()}
              &nbsp;»
            </p>
            {/* Deux colonnes maximum, et seulement à partir de xl. En trois
                colonnes, la colonne de texte tombe à ~230 px : une description
                de tacos s'y étale sur quatre lignes à côté d'une photo
                minuscule. Une carte horizontale a besoin de largeur, pas de
                densité. */}
            <div className="grid gap-3 xl:grid-cols-2">
              {results.map(renderCard)}
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.id} aria-label={section.label}>
              <SectionTitle
                id={section.id}
                label={section.label}
                count={section.count}
              />

              <div className="mt-4 flex flex-col gap-5">
                {section.blocks.map((block) => (
                  <div key={block.key}>
                    {block.label && (
                      <p
                        id={subAnchorId(block.key)}
                        className={`${ANCHOR_OFFSET} mb-2.5 pl-1 font-heading text-xs font-bold uppercase tracking-wider text-accent-mustard lg:scroll-mt-40`}
                      >
                        {block.label}
                      </p>
                    )}
                    <div className="grid gap-3 xl:grid-cols-2">
                      {block.items.map(renderCard)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {configuredItem && (
        <ProductSheet
          // Remonte le composant à chaque produit : l'état initial est posé par
          // les initialiseurs de useState, donc plus aucun effet de remise à
          // zéro, et aucun risque de garder la formule du produit précédent.
          key={`${configuredItem._id}-${sheet?.lineKey ?? "new"}`}
          item={configuredItem}
          optionsByCategory={optionsByCategory}
          initialLine={editedLine}
          onClose={closeProduct}
        />
      )}
    </>
  );
}
