"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { NAV_ITEMS } from "./navConfig";

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border-subtle bg-background/95 lg:flex">
      <Link
        href="/dashboard"
        className="flex items-center gap-3 border-b border-border-subtle px-6 py-5"
      >
        <Image src="/logo-niwa.png" alt="" width={36} height={36} />
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          NIWA <span className="text-accent-mustard">FOOD</span>
        </span>
      </Link>

      <div className="px-6 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/40">
        Espace de travail
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-foreground/75 hover:bg-surface-2/70 hover:text-foreground"
              }`}
            >
              <span
                className={`${item.icon} text-lg transition-transform group-hover:scale-105`}
              />
              {item.label}
              {isActive && (
                <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Le bloc profil/déconnexion a été retiré : il vit désormais dans le
          UserMenu de la topbar, donc accessible aussi sur mobile — où cette
          sidebar n'est jamais rendue (hidden lg:flex). */}
    </aside>
  );
}
