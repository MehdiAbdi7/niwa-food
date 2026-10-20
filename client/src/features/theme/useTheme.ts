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
 * Bascule de thème en un seul fondu, via l'API View Transitions : le
 * navigateur photographie la page avant et après, puis fond les deux images.
 * Couleurs, images de fond et dégradés changent donc ensemble. Des transitions
 * CSS par élément ne le peuvent pas : chacune a sa durée, et un dégradé ne
 * s'anime pas.
 *
 * `theme-switching` (globals.css) coupe les transitions des éléments pendant
 * la bascule, sinon elles rejoueraient dans l'image « après ». Navigateur sans
 * l'API ou réglage « réduire les animations » : bascule instantanée.
 */
let currentTransition: ViewTransition | null = null;

function switchTheme(mode: ThemeMode) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (typeof document.startViewTransition !== "function" || reduceMotion) {
    applyThemeClass(mode);
    return;
  }

  const root = document.documentElement;
  root.classList.add("theme-switching");
  const transition = document.startViewTransition(() => applyThemeClass(mode));
  currentTransition = transition;
  // Double-clic rapide : la seconde bascule interrompt la première. Son
  // `ready` est alors rejeté (AbortError), ce qui est attendu : sans ce catch,
  // la console afficherait une erreur non gérée. Et sa fin ne doit pas
  // réactiver les transitions en pleine seconde bascule.
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    if (currentTransition === transition) {
      root.classList.remove("theme-switching");
    }
  });
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
