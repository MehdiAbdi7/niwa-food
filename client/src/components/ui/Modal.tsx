"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "sheet" | "lg";
  footer?: React.ReactNode;
  hideHeader?: boolean;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  // "sheet" reprend exactement la largeur de la fiche produit publique
  // (Sheet.tsx, sm:max-w-xl). Un cadre plus étroit que "lg" donne à la photo
  // un rapport de surface bien plus généreux, à hauteur d'image égale.
  sheet: "max-w-xl",
  lg: "max-w-2xl",
};

// Hauteur plafond, par taille.
//
// Le défaut 85vh convient à une modale de formulaire. Une fiche produit, elle,
// empile une grande photo PUIS les options : cinq points de hauteur d'écran en
// moins suffisaient à repousser la première rangée de formules sous le pied de
// page. "sheet" reprend donc les valeurs de la fiche publique.
//
// dvh et non vh : le vh se fige sur la hauteur du viewport barres masquées, ce
// qui fait dépasser la modale quand la barre d'adresse mobile réapparaît. Le
// dvh suit la hauteur réellement disponible.
const MAX_HEIGHT_CLASSES = {
  sm: "max-h-[85vh]",
  md: "max-h-[85vh]",
  sheet: "max-h-[88dvh] sm:max-h-[92dvh]",
  lg: "max-h-[85vh]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  hideHeader = false,
}: ModalProps) {
  // Echap pour fermer + verrou de défilement pendant que la modale est ouverte.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    // Voir lib/scrollLock.ts : l'ancien `body.style.overflow = "hidden"` était
    // neutralisé par l'overflow-x-clip du <html>, qui coupe la propagation de
    // l'overflow du body vers le viewport.
    lockScroll();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        // p-2 pour la fiche produit : le p-4 retirait 2rem de hauteur utile,
        // soit précisément ce qui manquait pour afficher la rangée de formules
        // sans scroller.
        size === "sheet" ? "p-2 sm:p-4" : "p-4"
      }`}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-food-md ${MAX_HEIGHT_CLASSES[size]} ${SIZE_CLASSES[size]}`}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <h2
              id="modal-title"
              className="font-heading text-lg font-bold text-foreground"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <span className="icon-[mdi--close] text-xl" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
