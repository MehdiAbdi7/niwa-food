"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setIsScrolled, toggleMenu, closeMenu } from "./navbarSlice";

export function useNavbar() {
  const isScrolled = useAppSelector((state) => state.navbar.isScrolled);
  const isMenuOpen = useAppSelector((state) => state.navbar.isMenuOpen);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleScroll = () => {
      dispatch(setIsScrolled(window.scrollY > 20));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [dispatch]);

  // Bloque le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Ferme le menu automatiquement si on repasse en desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) dispatch(closeMenu());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  // Ferme le menu avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch(closeMenu());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return {
    isScrolled,
    isMenuOpen,
    toggleMenu: () => dispatch(toggleMenu()),
    closeMenu: () => dispatch(closeMenu()),
  };
}
