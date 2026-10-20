"use client";

import { useLayoutEffect } from "react";
import { applyThemeClass } from "./useTheme";
import type { ThemeMode } from "./themeSlice";

// Lu par le navigateur pendant l'analyse du HTML, avant le premier affichage :
// la page ne s'affiche jamais en clair pour quelqu'un qui a choisi le sombre.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    const stored = localStorage.getItem("theme");
    const mode = stored || "system";
    const isDark = mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // localStorage indisponible (navigation privée stricte, cookies bloqués...)
    // → on ignore, la page reste simplement en mode clair par défaut
  }
})();
`;

/**
 * Applique le thème enregistré avant que la page s'affiche.
 *
 * Deux cas, deux mécanismes :
 *
 * 1. La page arrive du serveur (premier chargement, rechargement) : le
 *    <script> s'exécute pendant la lecture du HTML.
 *
 * 2. React construit lui-même le document dans le navigateur : en changeant
 *    de langue (/ → /ar, le layout racine app/[lang] est remonté) ou sur la
 *    page 404. Un <script> créé par React ne s'exécute JAMAIS, et React
 *    réécrit la classe de <html> sans « dark ». C'est useLayoutEffect qui
 *    prend le relais : il s'exécute après la mise à jour du DOM mais avant
 *    l'affichage, donc sans flash de thème clair.
 *
 * Le type du script change selon le côté (modèle du guide Next « Preventing
 * flash before hydration ») : "text/javascript" côté serveur, "text/plain"
 * côté navigateur. React n'avertit plus d'un script qu'il ne peut pas
 * exécuter, et suppressHydrationWarning accepte la différence d'attribut.
 */
export function ThemeScript() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as ThemeMode | null;
      applyThemeClass(stored || "system");
    } catch {
      // Même cas que dans le script : on reste en clair.
    }
  }, []);

  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
