"use client";

import { useMemo, useState } from "react";
import { CategoryChips } from "./CategoryChips";
import { ProductGrid } from "./ProductGrid";
import { Input } from "@/components/ui/Input";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import {
  useGetMenuItemsQuery,
  useGetMenuCategoriesQuery,
} from "@/features/menu/menuApi";
import { buildMenuNav } from "@/features/menu/menuNav";
import {
  buildMenuSections,
  buildSpyAnchors,
  sortMenuItems,
  subAnchorId,
} from "@/features/publicOrder/menuBlocks";
import {
  useSectionSpy,
  scrollToAnchor,
} from "@/features/publicOrder/useSectionSpy";
import type { MenuItem } from "@/types/menuItem";

interface MenuBrowserProps {
  quantityByItem: Record<string, number>;
  onSelect: (item: MenuItem) => void;
}

// Décalage réservé sous la topbar (top-16) ET sous le bandeau collant
// recherche + catégories, qui fait environ 8rem une fois la rangée de
// sous-sections dépliée. Sans lui, un titre visé par une ancre se range
// DERRIÈRE ces deux barres et l'équipe croit avoir atterri au mauvais endroit.
const ANCHOR_OFFSET = "scroll-mt-52";

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
          sur lui : ça garde scrollIntoView juste même si le titre venait à
          devenir collant un jour. */}
      <span
        id={id}
        aria-hidden="true"
        className={`block h-0 ${ANCHOR_OFFSET}`}
      />

      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-heading text-lg font-bold text-foreground">
          {label}
        </h2>
        <span className="tabular-nums rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
          {count}
        </span>
        <span
          aria-hidden="true"
          className="h-px flex-1 bg-linear-to-r from-primary/40 to-transparent"
        />
      </div>
    </>
  );
}

/**
 * Parcours du menu en prise de commande.
 *
 * Partagé entre /commandes/nouvelle et /commandes/[id]/ajouter : même parcours
 * produit dans les deux cas, une seule implémentation à maintenir.
 *
 * Aligné sur la carte publique (DishList) : la carte s'affiche EN ENTIER,
 * découpée en sections et triée du moins cher au plus cher via les mêmes
 * fonctions pures (buildMenuNav → buildMenuSections → sortMenuItems). Les
 * pastilles ne filtrent plus, elles font défiler, et le scroll-spy allume
 * celle qu'on est en train de lire.
 *
 * Pourquoi abandonner le filtrage : au comptoir, filtrer masquait 30 produits
 * sur 36 et imposait un retour à « Tout le menu » entre chaque article d'une
 * même commande. Une carte continue se parcourt comme une ardoise.
 *
 * L'état de navigation est LOCAL et non dans browseSlice : ce slice appartient
 * au parcours client public. Le partager coupleraient deux écrans qui n'ont
 * aucune raison de se synchroniser.
 */
export function MenuBrowser({ quantityByItem, onSelect }: MenuBrowserProps) {
  const { data: menuItems, isLoading } = useGetMenuItemsQuery();
  const { data: categories } = useGetMenuCategoriesQuery();

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeSubKey, setActiveSubKey] = useState<string | null>(null);

  // Un article épuisé n'est pas commandable : il ne doit apparaître nulle part,
  // ni dans la grille, ni dans les compteurs des pastilles.
  const availableItems = useMemo(
    () => (menuItems ?? []).filter((item) => item.available),
    [menuItems],
  );

  // Même source de vérité que la carte publique et la page Menu : un groupe
  // déclaré dans categoryGroups.ts se répercute partout sans reconfiguration.
  const sections = useMemo(
    () =>
      buildMenuSections(
        buildMenuNav(categories ?? [], availableItems),
        availableItems,
      ),
    [categories, availableItems],
  );

  const anchors = useMemo(() => buildSpyAnchors(sections), [sections]);

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  // La recherche couvre la description : c'est souvent par un ingrédient qu'on
  // retrouve un produit dont on a oublié le nom.
  const results = useMemo(() => {
    if (!isSearching) return [];
    return sortMenuItems(
      availableItems.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      ),
    );
  }, [availableItems, query, isSearching]);

  // Désactivé pendant une recherche : il n'y a plus de section à désigner, et
  // laisser une pastille allumée ferait croire à un filtre encore actif.
  useSectionSpy(
    anchors,
    (anchor) => {
      setActiveGroup(anchor.group);
      setActiveSubKey(anchor.subKey);
    },
    !isSearching,
  );

  function handleNavigate(anchorId: string) {
    // Une recherche en cours masque les sections : sans ce nettoyage, l'ancre
    // visée n'existerait pas encore dans le DOM et le clic ne ferait rien.
    if (isSearching) setSearch("");
    // rAF : laisse React repeindre la carte complète avant de mesurer.
    requestAnimationFrame(() => scrollToAnchor(anchorId));
  }

  return (
    <>
      {/* Recherche et catégories restent visibles pendant qu'on parcourt la
          grille : en plein service, remonter chercher un filtre coûte cher.
          z-20 (contenu collant de page) et non z-10 : à égalité avec le badge
          de quantité des cartes, c'était l'ordre du DOM qui tranchait — la
          grille venant après, les badges défilaient PAR-DESSUS cette barre.
          top-16 = hauteur de la topbar, elle-même en z-40 donc au-dessus. */}
      <div className="sticky top-16 z-20 -mx-1 mb-5 flex flex-col gap-3 bg-background/95 px-1 py-3 backdrop-blur-sm">
        <Input
          placeholder="Rechercher un produit ou un ingrédient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <CategoryChips
          sections={sections}
          activeGroup={activeGroup}
          activeSubKey={activeSubKey}
          onNavigate={handleNavigate}
        />
      </div>

      {isLoading ? (
        <SkeletonGrid count={8} />
      ) : isSearching ? (
        results.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
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
              onClick={() => setSearch("")}
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
              produit{results.length > 1 ? "s" : ""} pour «&nbsp;{search.trim()}
              &nbsp;»
            </p>
            <ProductGrid
              items={results}
              quantityByItem={quantityByItem}
              onSelect={onSelect}
            />
          </div>
        )
      ) : (
        <div className="flex flex-col gap-9">
          {sections.map((section) => (
            <section key={section.id} aria-label={section.label}>
              <SectionTitle
                id={section.id}
                label={section.label}
                count={section.count}
              />

              <div className="flex flex-col gap-6">
                {section.blocks.map((block) => (
                  <div key={block.key}>
                    {block.label && (
                      <p
                        id={subAnchorId(block.key)}
                        className={`${ANCHOR_OFFSET} mb-2.5 pl-1 font-heading text-xs font-bold uppercase tracking-wider text-accent-mustard`}
                      >
                        {block.label}
                      </p>
                    )}
                    <ProductGrid
                      items={block.items}
                      quantityByItem={quantityByItem}
                      onSelect={onSelect}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
