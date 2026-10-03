"use client";

import type { KeyboardEvent } from "react";
import { formatDA } from "@/lib/format";
import type { UsePromoCodeResult } from "@/features/publicOrder/usePromoCode";

/**
 * Saisie d'un code promo, dans le tunnel de commande.
 *
 * Deux états mutuellement exclusifs, jamais superposés : soit on saisit, soit
 * on voit ce qui a été accordé. Laisser le champ visible sous une remise
 * appliquée invite à en essayer un second, alors qu'un seul code s'applique
 * par commande.
 *
 * PAS de <form> imbriqué : ce composant vit à l'intérieur du tunnel de
 * commande, et un formulaire dans un formulaire est invalide en HTML — la
 * touche Entrée est gérée à la main.
 */
export function PromoCodeField({ promo }: { promo: UsePromoCodeResult }) {
  const { input, setInput, applied, error, isChecking, apply, clear } = promo;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    // Sans ça, Entrée soumettrait le formulaire parent et enverrait la
    // commande alors que le client voulait seulement valider son code.
    event.preventDefault();
    if (!isChecking) apply();
  }

  if (applied) {
    return (
      <section
        aria-live="polite"
        className="flex items-center gap-3 rounded-2xl border border-accent-green/40 bg-accent-green/10 px-4 py-3 backdrop-blur-sm"
      >
        <span
          aria-hidden="true"
          className="icon-[mdi--ticket-percent] shrink-0 text-2xl text-accent-green"
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="font-heading text-sm font-bold text-foreground">
            Code {applied.code} appliqué
          </p>
          <p className="tabular-nums text-xs text-foreground/75">
            −{applied.discountPercent}% sur vos articles ·{" "}
            <span className="font-bold text-accent-green">
              {formatDA(applied.discountAmount)} économisés
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={clear}
          aria-label="Retirer le code promo"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux"
        >
          <span aria-hidden="true" className="icon-[mdi--close] text-lg" />
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-1.5">
      <label
        htmlFor="promoCode"
        className="flex items-baseline gap-2 font-heading text-sm font-bold text-foreground"
      >
        Code promo
        <span className="text-xs font-semibold text-foreground/40">
          facultatif
        </span>
      </label>

      <div className="flex gap-2">
        <input
          id="promoCode"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          value={input}
          // Mise en majuscules à la frappe : le code est stocké et comparé en
          // majuscules côté serveur, autant que ce que le client voit
          // corresponde à ce qui part.
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Ex : NIWA10"
          className="h-12 min-w-0 flex-1 rounded-xl border border-primary/25 bg-background/85 px-4 font-heading font-bold uppercase tracking-wider text-foreground outline-none transition-colors placeholder:font-body placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-foreground/40 focus:border-primary"
        />

        <button
          type="button"
          onClick={apply}
          disabled={isChecking || input.trim().length < 2}
          className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-primary px-5 font-heading text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
        >
          {isChecking ? (
            <span
              aria-hidden="true"
              className="icon-[mdi--loading] animate-spin text-lg"
            />
          ) : (
            "Appliquer"
          )}
        </button>
      </div>

      {/* role="alert" : le message apparaît après une action volontaire, il
          doit être annoncé sans que le client ait à revenir dessus. */}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-accent-bordeaux/10 px-3 py-2 text-sm font-semibold text-accent-bordeaux backdrop-blur-sm"
        >
          {error}
        </p>
      )}
    </section>
  );
}
