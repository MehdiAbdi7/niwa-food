"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { NAV_ITEMS, BOTTOM_NAV_PRIMARY_HREFS } from "./navConfig";

// Utilisée sous lg: la tablette posée à plat en cuisine n'a pas la place (ni
// l'usage) pour une sidebar verticale — on préfère une barre basse au pouce.
export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin, logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const primaryItems = visibleItems.filter((item) =>
    BOTTOM_NAV_PRIMARY_HREFS.includes(item.href),
  );
  const secondaryItems = visibleItems.filter(
    (item) => !BOTTOM_NAV_PRIMARY_HREFS.includes(item.href),
  );

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Panneau "Plus" — même grammaire que le panneau mobile du site public */}
      <div
        onClick={() => setIsMoreOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isMoreOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border-subtle bg-surface p-4 transition-transform duration-300 ease-out lg:hidden ${
          isMoreOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-heading text-sm font-bold text-foreground">
            Plus
          </span>
          <button
            onClick={() => setIsMoreOpen(false)}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <span className="icon-[mdi--close] text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {secondaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMoreOpen(false)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-semibold ${
                isActive(item.href)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-2 text-foreground/70"
              }`}
            >
              <span className={`${item.icon} text-xl`} />
              {item.label}
            </Link>
          ))}

          <button
            onClick={logout}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-2 px-2 py-3 text-xs font-semibold text-accent-bordeaux"
          >
            <span className="icon-[mdi--logout] text-xl" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Barre basse */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              isActive(item.href) ? "text-primary" : "text-foreground/75"
            }`}
          >
            <span className={`${item.icon} text-2xl`} />
            {item.label}
          </Link>
        ))}

        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-foreground/75"
        >
          <span className="icon-[mdi--dots-horizontal-circle-outline] text-2xl" />
          Plus
        </button>
      </nav>
    </>
  );
}
