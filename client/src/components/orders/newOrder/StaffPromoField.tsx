"use client";

import type { KeyboardEvent } from "react";
import { formatDA } from "@/lib/format";
import type { UsePromoCodeResult } from "@/features/publicOrder/usePromoCode";

/**
 * Saisie d'un code promo dans le ticket du dashboard.
 *
 * Composant DISTINCT de PromoCodeField, qui sert la carte publique : celui-là
 * est calibré pour un écran de commande (bordures primary, champs de 48 px,
 * fond translucide), celui-ci doit tenir dans une colonne de 352 px au milieu
 * d'une dizaine d'autres champs. Le partager aurait imposé un composant à
 * variantes pour économiser trente lignes.
 *
 * Le hook, lui, EST partagé (usePromoCode) : c'est la logique de vérification
 * et de revalidation qui compte, et elle doit être identique des deux côtés —
 * sinon un code accepté au comptoir serait refusé sur le site, ou l'inverse.
 */
export function StaffPromoField({ promo }: { promo: UsePromoCodeResult }) {
  const { input, setInput, applied, error, isChecking, apply, clear } = promo;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    // Le ticket n'est pas un <form>, mais Entrée doit valider le code et non
    // remonter au premier bouton venu.
    event.preventDefault();
    if (!isChecking) apply();
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-accent-green/10 px-3 py-2.5">
        <span
          aria-hidden="true"
          className="icon-[mdi--ticket-percent] shrink-0 text-lg text-accent-green"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-bold uppercase tracking-wider text-foreground">
            {applied.code}
          </span>
          <span className="tabular-nums text-xs text-accent-green">
            −{applied.discountPercent}% · {formatDA(applied.discountAmount)}
          </span>
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label="Retirer le code promo"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-surface hover:text-accent-bordeaux"
        >
          <span aria-hidden="true" className="icon-[mdi--close] text-base" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="staff-promo"
        className="text-sm font-semibold text-foreground"
      >
        Code promo{" "}
        <span className="text-xs font-normal text-foreground/45">
          si le client en a un
        </span>
      </label>

      <div className="flex gap-1.5">
        <input
          id="staff-promo"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="NIWA10"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface px-3.5 font-heading font-bold uppercase tracking-wider text-foreground outline-none transition-colors placeholder:font-body placeholder:font-normal placeholder:tracking-normal placeholder:text-foreground/40 focus:border-primary"
        />
        <button
          type="button"
          onClick={apply}
          disabled={isChecking || input.trim().length < 2}
          className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle px-3 text-sm font-bold text-foreground/70 transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          {isChecking ? (
            <span
              aria-hidden="true"
              className="icon-[mdi--loading] animate-spin text-lg"
            />
          ) : (
            "OK"
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs font-semibold text-accent-bordeaux">{error}</p>
      )}
    </div>
  );
}
