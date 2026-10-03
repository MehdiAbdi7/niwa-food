"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  searchChanged,
  selectActiveGroup,
  selectActiveSubKey,
  selectSearch,
} from "@/features/publicOrder/browseSlice";
import {
  sectionAnchorId,
  sectionBlockKey,
  subAnchorId,
} from "@/features/publicOrder/menuBlocks";
import { scrollToAnchor } from "@/features/publicOrder/useSectionSpy";
import type { MenuNavGroup } from "@/features/menu/menuNav";

interface MenuFiltersProps {
  nav: MenuNavGroup[];
}

// Une icône par famille : sur un rail horizontal de six pastilles, la forme se
// reconnaît avant que le mot ne se lise. Repli neutre pour toute catégorie
// ajoutée plus tard depuis le dashboard.
const GROUP_ICONS: Record<string, string> = {
  burgers: "icon-[mdi--hamburger]",
  tacos: "icon-[mdi--taco]",
  pizzas: "icon-[mdi--pizza]",
  boissons: "icon-[mdi--bottle-soda-classic-outline]",
  canettes: "icon-[mdi--cup]",
  bouteilles: "icon-[mdi--bottle-soda-classic-outline]",
  accompagnements: "icon-[mdi--french-fries]",
  salades: "icon-[mdi--bowl-mix-outline]",
  desserts: "icon-[mdi--cupcake]",
};

function iconFor(label: string): string {
  return (
    GROUP_ICONS[label.trim().toLowerCase()] ?? "icon-[mdi--silverware-variant]"
  );
}

interface SubChip {
  key: string;
  label: string;
  count: number;
}

// Les sous-entrées viennent soit de deux catégories fusionnées (Burgers =
// Classique + Signature), soit d'un découpage par mot-clé (Pizzas rouges /
// blanches). Les clés DOIVENT être identiques à celles de buildMenuSections,
// sans quoi l'ancre visée n'existe pas dans la page.
function getSubChips(group: MenuNavGroup): SubChip[] {
  if (group.subs.length > 0) {
    return group.subs
      .filter((sub) => sub.count > 0)
      .map((sub) => ({
        key: sub.categoryId,
        label: sub.label,
        count: sub.count,
      }));
  }

  if (group.sections.length > 1) {
    return group.sections.map((section) => ({
      key: sectionBlockKey(group.label, section.label),
      label: section.label,
      count: section.count,
    }));
  }

  return [];
}

/**
 * Navigation de la carte.
 *
 * Ce n'est plus un filtre : chaque entrée fait défiler jusqu'à sa section, et
 * l'entrée allumée est celle que le client est en train de lire (voir
 * useSectionSpy). Le repère se met donc à jour tout seul quand on scrolle,
 * comme sur les cartes de livraison auxquelles il est habitué.
 *
 * Deux dispositions, un seul composant : rail collant en haut sur mobile,
 * colonne latérale à partir de lg. Un composant par disposition dupliquerait
 * la logique Redux et le risque de désynchronisation.
 */
export function MenuFilters({ nav }: MenuFiltersProps) {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectSearch);
  const activeGroup = useAppSelector(selectActiveGroup);
  const activeSubKey = useAppSelector(selectActiveSubKey);

  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const railRef = useRef<HTMLDivElement>(null);

  const totalCount = nav.reduce((sum, group) => sum + group.count, 0);
  const currentGroup = nav.find((group) => group.label === activeGroup) ?? null;
  const subChips = currentGroup ? getSubChips(currentGroup) : [];

  // Sur mobile le rail défile horizontalement : sans ce recentrage, la
  // catégorie active sortirait de l'écran au bout de trois sections et le
  // repère deviendrait invisible au moment précis où il sert.
  useEffect(() => {
    if (!activeGroup) return;

    const rail = railRef.current;
    const chip = chipRefs.current.get(activeGroup);
    if (!rail || !chip) return;

    // Pas de scrollIntoView ici, surtout pas : cette méthode fait défiler TOUS
    // les ancêtres qui en ont besoin, y compris la fenêtre — et un défilement
    // programmé annule celui qui est déjà en cours. Cliquer « Burgers »
    // lançait le défilement doux vers la section, que ce recentrage
    // interrompait à mi-course. Ici on n'écrit que le scrollLeft du rail,
    // la page n'est jamais touchée.
    if (rail.scrollWidth <= rail.clientWidth) return; // en colonne (lg) : rien à faire

    const target = chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    rail.scrollTo({
      left: Math.max(0, target),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeGroup]);

  return (
    // dvh et non vh : sur mobile le vh se fige sur la hauteur barres masquées,
    // ce qui fait dépasser la colonne dès que la barre d'adresse réapparaît.
    // overflow-hidden ici + zone défilante à l'intérieur : la recherche et le
    // compteur restent toujours visibles, seule la liste des catégories
    // défile. Faire défiler l'aside entier escamotait le champ de recherche
    // exactement quand on en avait besoin.
    <aside className="sticky top-20 z-30 mb-6 flex flex-col gap-2.5 rounded-3xl border border-primary/20 bg-background/70 p-2.5 shadow-[0_10px_35px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-3 lg:top-24 lg:mb-0 lg:max-h-[calc(100dvh-8rem)] lg:w-64 lg:shrink-0 lg:overflow-hidden lg:p-4 dark:bg-primary/10">
      <label className="relative block">
        <span className="sr-only">Rechercher un plat</span>
        <span
          aria-hidden="true"
          className="icon-[mdi--magnify] pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-foreground/40"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => dispatch(searchChanged(event.target.value))}
          placeholder="Un plat, un ingrédient..."
          className="h-12 w-full rounded-full border border-primary/20 bg-background/60 pl-12 pr-11 text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-primary focus:bg-background/90 lg:h-11 lg:rounded-xl lg:pl-11 lg:text-sm"
        />
        {/* Sortie de secours explicite : le × natif de input[type=search]
            n'apparaît pas sur Firefox ni sur la plupart des navigateurs
            mobiles, et une recherche qu'on ne sait pas effacer donne
            l'impression d'un menu amputé. */}
        {search.length > 0 && (
          <button
            type="button"
            onClick={() => dispatch(searchChanged(""))}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            <span aria-hidden="true" className="icon-[mdi--close] text-lg" />
          </button>
        )}
      </label>

      <p className="hidden items-baseline justify-between px-1 lg:mt-1 lg:flex">
        <span className="font-heading text-xs font-bold uppercase tracking-wide text-foreground/70">
          La carte
        </span>
        <span className="tabular-nums text-xs font-semibold text-foreground/70">
          {totalCount} plats
        </span>
      </p>

      {/* Zone défilante. En colonne (lg), min-h-0 est indispensable : sans
          lui un enfant de flex refuse de passer sous la hauteur de son
          contenu, et overflow-y-auto n'a jamais rien à faire défiler. */}
      <div className="flex flex-col gap-2.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div
          ref={railRef}
          className="scrollbar-hide flex gap-2 overflow-x-auto pb-0.5 lg:flex-col lg:gap-1 lg:overflow-x-visible lg:pb-0"
        >
          {nav.map((group) => {
            const isActive = activeGroup === group.label;

            return (
              <button
                key={group.label}
                ref={(element) => {
                  if (element) chipRefs.current.set(group.label, element);
                  else chipRefs.current.delete(group.label);
                }}
                type="button"
                onClick={() => scrollToAnchor(sectionAnchorId(group.label))}
                aria-current={isActive ? "true" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 font-heading text-sm font-bold transition-colors lg:w-full lg:justify-start lg:rounded-xl lg:px-3 lg:py-2.5 ${
                  isActive
                    ? "border-primary bg-primary text-on-primary shadow-sm"
                    : "border-primary/25 bg-background/50 text-foreground hover:border-primary hover:bg-background/80"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`${iconFor(group.label)} shrink-0 text-lg ${
                    isActive ? "" : "text-primary"
                  }`}
                />
                {group.label}
                {/* Plus d'opacité sur le compteur : à 70 % sur la puce dorée
                    active, il tombait à 3,4:1, sous le seuil AA de 4,5:1. */}
                <span
                  className={`tabular-nums text-xs lg:ml-auto ${
                    isActive ? "" : "text-foreground/70"
                  }`}
                >
                  {group.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Second niveau, seulement si la section ouverte se subdivise. Forme
          volontairement différente du premier — souligné plutôt que rempli —
          pour qu'on lise une subdivision, pas un pair. */}
        {subChips.length > 1 && (
          <div className="flex flex-col gap-1 rounded-2xl bg-primary/5 px-2 py-2 lg:ml-2 lg:rounded-xl lg:px-1.5 lg:py-1.5">
            <span className="px-2 pb-0.5 text-xs font-bold uppercase tracking-wide text-foreground/70">
              {currentGroup?.label}
            </span>
            <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-x-visible">
              {subChips.map((sub) => {
                const isActive = activeSubKey === sub.key;

                return (
                  <button
                    key={sub.key}
                    type="button"
                    onClick={() => scrollToAnchor(subAnchorId(sub.key))}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border-b-2 px-3 py-1.5 text-xs font-bold transition-colors lg:w-full lg:justify-between lg:border-b-0 lg:border-l-2 ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-foreground/75 hover:text-foreground"
                    }`}
                  >
                    {sub.label}
                    <span className="tabular-nums opacity-55">{sub.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
