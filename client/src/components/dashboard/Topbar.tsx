"use client";

import Image from "next/image";
import { StoreSwitcher } from "./StoreSwitcher";
import { ServiceBadge } from "./ServiceBadge";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  return (
    // z-40, au-dessus de TOUT le contenu de page (échelle du projet : contenu
    // collant z-20, superpositions de page z-30, cette barre z-40, panneaux
    // mobiles z-50). Le backdrop-blur ci-dessous crée un contexte
    // d'empilement : le z-50 du panneau UserMenu ne vaut qu'À L'INTÉRIEUR de
    // ce header, il ne peut jamais dépasser le z-index de la barre elle-même.
    // C'est pourquoi c'est ici qu'on monte la valeur, et pas dans UserMenu.
    <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-border-subtle bg-background/95 px-4 py-3 shadow-[0_4px_18px_-14px_rgba(61,39,22,0.45)] backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex items-center gap-2 sm:hidden">
          <Image
            src="/logo-niwa.png"
            alt=""
            width={30}
            height={30}
            className="h-8 w-8 shrink-0"
          />
          <span className="font-heading text-sm font-bold text-foreground">
            NIWA <span className="text-accent-mustard">FOOD</span>
          </span>
        </div>
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
          <span className="icon-[mdi--receipt-text-outline] text-lg" />
        </span>
        <div className="hidden min-w-0 sm:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Niwa Food · Espace équipe
          </p>
          <h1 className="truncate font-heading text-lg font-bold text-foreground sm:text-xl">
            Chaque commande compte
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:block">
          <ServiceBadge />
        </div>
        <StoreSwitcher />
        {/* Le ThemeToggle a rejoint le UserMenu : à trois contrôles plus le
            titre, la barre débordait sur un écran de 360 px. */}
        <UserMenu />
      </div>
    </header>
  );
}
