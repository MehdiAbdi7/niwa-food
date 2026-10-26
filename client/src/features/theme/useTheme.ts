"use client";

import { useEffect, useCallback, useSyncExternalStore } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTheme as setThemeAction, type ThemeMode } from "./themeSlice";

function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeToSystemTheme(onChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

// Exportée pour ThemeScript, qui réapplique le thème quand React reconstruit
// le document dans le navigateur.
export function applyThemeClass(mode: ThemeMode) {
  const isDark =
    mode === "dark" || (mode === "system" && getSystemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Change le thème sans déclencher les transitions des éléments, qui
 * joueraient chacune à sa vitesse (de 150 à 300 ms) au lieu de changer d'un
 * coup. `theme-switching` (globals.css) les coupe, puis la lecture de
 * getComputedStyle force le navigateur à calculer les nouveaux styles tout de
 * suite, pendant qu'elles sont coupées. Sans cette lecture, il les calculerait
 * après le retrait de la classe, et les transitions joueraient quand même.
 */
function applyThemeWithoutTransitions(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  applyThemeClass(mode);
  window.getComputedStyle(root).getPropertyValue("color");
  setTimeout(() => root.classList.remove("theme-switching"), 1);
}

/**
 * Bascule de thème en un seul fondu, via l'API View Transitions : le
 * navigateur photographie la page avant et après, puis fond les deux images.
 * Couleurs, images de fond et dégradés changent donc ensemble. Des transitions
 * CSS par élément ne le peuvent pas : chacune a sa durée, et un dégradé ne
 * s'anime pas.
 *
 * Sans fondu possible (navigateur sans l'API, réglage « réduire les
 * animations », ou onglet en arrière-plan, où le navigateur saute le fondu) :
 * bascule instantanée, grâce à applyThemeWithoutTransitions dans les deux cas.
 */
function switchTheme(mode: ThemeMode) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (typeof document.startViewTransition !== "function" || reduceMotion) {
    applyThemeWithoutTransitions(mode);
    return;
  }

  const transition = document.startViewTransition(() =>
    applyThemeWithoutTransitions(mode),
  );
  // Fondu sauté (double-clic rapide, onglet en arrière-plan) : `ready` est
  // rejeté (AbortError), ce qui est attendu. Sans ce catch, la console
  // afficherait une erreur non gérée.
  transition.ready.catch(() => {});
}

export function useTheme() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  // Préférence de l'OS, suivie en direct. Côté serveur, elle est inconnue :
  // `false` jusqu'à l'hydratation, puis React relit la vraie valeur.
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    () => false,
  );
  // Le thème réellement affiché : en mode "system", c'est l'OS qui décide.
  // Les boutons s'en servent pour leur icône, `mode` seul ne suffit pas.
  const isDark = mode === "dark" || (mode === "system" && systemPrefersDark);

  // Au montage : Redux "rattrape" ce que le script anti-FOUC avait déjà décidé.
  // Pas besoin de retoucher le DOM ici, il est déjà correct depuis le premier paint.
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    dispatch(setThemeAction(stored || "system"));
  }, [dispatch]);

  // Réagit en direct si l'utilisateur change la préférence de son OS
  // pendant qu'il est en mode "system"
  useEffect(() => {
    if (mode !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => switchTheme(mode);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      localStorage.setItem("theme", newMode);
      switchTheme(newMode);
      dispatch(setThemeAction(newMode));
    },
    [dispatch],
  );

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return { mode, isDark, setTheme, toggleTheme };
}
