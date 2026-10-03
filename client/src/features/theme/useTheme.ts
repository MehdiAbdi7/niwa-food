"use client";

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTheme as setThemeAction, type ThemeMode } from "./themeSlice";

function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeClass(mode: ThemeMode) {
  const isDark =
    mode === "dark" || (mode === "system" && getSystemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

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
    const handleChange = () => applyThemeClass(mode);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  const setTheme = useCallback(
    (newMode: ThemeMode) => {
      localStorage.setItem("theme", newMode);
      applyThemeClass(newMode);
      dispatch(setThemeAction(newMode));
    },
    [dispatch],
  );

  const toggleTheme = useCallback(() => {
    const currentIsDark =
      mode === "dark" || (mode === "system" && getSystemPrefersDark());
    setTheme(currentIsDark ? "light" : "dark");
  }, [mode, setTheme]);

  return { mode, setTheme, toggleTheme };
}
