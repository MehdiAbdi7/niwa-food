"use client";

import Image from "next/image";
import { useAuth } from "@/features/auth/useAuth";
import { useTheme } from "@/features/theme/useTheme";
import { STORE_LABELS } from "@/types/store";

/**
 * Barre du haut de l'espace livreur.
 *
 * Trois choses, pas une de plus : qui je suis, le thème, la sortie. Un livreur
 * n'a ni magasin à changer, ni service à ouvrir, ni page à parcourir — lui
 * servir la topbar du dashboard reviendrait à lui montrer des contrôles morts.
 *
 * Le bouton de déconnexion est un vrai bouton et non un menu déroulant : c'est
 * la seule action de cette barre, l'enterrer d'un cran n'apporterait rien.
 */
export function DeliveryHeader() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();

  const isDark = mode === "dark";

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border-subtle bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <Image
          src="/logo-niwa.png"
          alt="Niwa Food"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Livraison
          </p>
          <p className="truncate font-heading text-sm font-bold text-foreground">
            {user?.firstname}
            {user?.store && (
              <span className="font-normal text-foreground/75">
                {" · "}
                {STORE_LABELS[user.store]}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Basculer le thème clair/sombre"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle text-foreground/75 transition-colors hover:border-primary hover:text-foreground"
        >
          <span
            aria-hidden="true"
            className={`${
              isDark
                ? "icon-[mdi--white-balance-sunny]"
                : "icon-[mdi--moon-waning-crescent]"
            } text-lg`}
          />
        </button>

        <button
          type="button"
          onClick={logout}
          aria-label="Se déconnecter"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle text-accent-bordeaux transition-colors hover:bg-accent-bordeaux/10"
        >
          <span aria-hidden="true" className="icon-[mdi--logout] text-lg" />
        </button>
      </div>
    </header>
  );
}
