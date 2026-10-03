"use client";

import { useActiveStore } from "@/features/store/useActiveStore";
import { STORES, STORE_LABELS } from "@/types/store";

// Invisible pour un employee : son magasin est fixé par son compte, pas de
// choix à faire (voir useActiveStore).
export function StoreSwitcher() {
  const { activeStore, isAllStores, canSwitchStore, setActiveStore } =
    useActiveStore();

  if (!canSwitchStore) return null;

  return (
    <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface p-1">
      <button
        onClick={() => setActiveStore(null)}
        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
          isAllStores
            ? "bg-primary text-on-primary"
            : "text-foreground/75 hover:text-foreground"
        }`}
      >
        Tous
      </button>
      {STORES.map((store) => (
        <button
          key={store}
          onClick={() => setActiveStore(store)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            !isAllStores && activeStore === store
              ? "bg-primary text-on-primary"
              : "text-foreground/75 hover:text-foreground"
          }`}
        >
          {STORE_LABELS[store]}
        </button>
      ))}
    </div>
  );
}
