"use client";

import { useEffect, type RefObject } from "react";

/**
 * Publie la hauteur réelle d'un élément dans une variable CSS posée sur
 * <html>, pour que le reste de la page puisse s'en servir dans ses calculs.
 *
 * Deux usages aujourd'hui :
 * - --header-height (Navbar) : elle dépend du bandeau démo (présent ou non
 *   selon DEMO_MODE), qui passe sur deux lignes sur un téléphone de 360 px
 *   (header de 97 px qui monte à 114). Les éléments collants de la carte la
 *   lisent via --sticky-top (voir globals.css) et restent toujours SOUS le
 *   header.
 * - --menu-nav-height (MenuFilters) : sur mobile, la barre des catégories
 *   grandit quand des sous-catégories s'affichent. Les ancres de la carte
 *   s'en servent pour ne pas atterrir derrière elle.
 */
export function useHeightVar(
  ref: RefObject<HTMLElement | null>,
  variableName: `--${string}`,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const root = document.documentElement;

    // ResizeObserver plutôt qu'un écouteur "resize" sur la fenêtre : la
    // hauteur peut changer sans que la fenêtre bouge (police chargée après
    // coup, texte qui passe à la ligne, sous-catégories qui apparaissent).
    // L'observer est prévenu dans tous ces cas, et une première fois dès
    // observe().
    const observer = new ResizeObserver(() => {
      root.style.setProperty(variableName, `${element.offsetHeight}px`);
    });
    observer.observe(element);

    // En quittant la page, la valeur mesurée ne veut plus rien dire : on rend
    // la main à la valeur par défaut de globals.css.
    return () => {
      observer.disconnect();
      root.style.removeProperty(variableName);
    };
  }, [ref, variableName]);
}
