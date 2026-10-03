"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLazyLookupOrderQuery } from "@/features/publicOrder/publicOrderApi";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  getLastOrderServerSnapshot,
  getLastOrderSnapshot,
  parseLastOrder,
  subscribeLastOrder,
} from "@/lib/lastOrder";
import { STORES, STORE_LABELS, type Store } from "@/types/store";

/**
 * Retrouver sa commande sans le lien de suivi.
 *
 * Le magasin est DEMANDÉ, pas deviné : le numéro 2 existe à Kouba comme à
 * Chéraga. Chercher dans les deux obligerait, en cas de doublon, à afficher
 * les deux clients pour que la personne choisisse — donc à montrer le prénom
 * d'un inconnu à quelqu'un qui ne le cherchait pas. Le client, lui, sait très
 * bien où il a commandé.
 *
 * Seules les commandes EN COURS sont retrouvables (voir lookupOrder côté
 * backend) : dans un fast-food, personne ne consulte le suivi d'un burger
 * mangé la veille, et restreindre le périmètre réduit d'autant ce qu'un
 * curieux pourrait énumérer.
 */
export function OrderLookupForm() {
  const router = useRouter();
  const [lookup, { isFetching }] = useLazyLookupOrderQuery();

  const [store, setStore] = useState<Store | null>(null);
  const [dailyNumber, setDailyNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Raccourci pour le client revenu sur le même appareil : il n'a rien à
  // taper. Lecture via useSyncExternalStore, comme TrackOrderButton — c'est le
  // crochet prévu pour une source de données extérieure à React, et il gère
  // l'instantané serveur sans divergence d'hydratation.
  const raw = useSyncExternalStore(
    subscribeLastOrder,
    getLastOrderSnapshot,
    getLastOrderServerSnapshot,
  );
  const lastOrder = useMemo(() => parseLastOrder(raw), [raw]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!store) {
      setError("Choisissez d'abord votre restaurant");
      return;
    }

    const parsed = Number(dailyNumber);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setError("Entrez le numéro figurant sur votre commande");
      return;
    }

    try {
      const { _id } = await lookup({ store, dailyNumber: parsed }).unwrap();
      // replace et non push : ce formulaire est un aiguillage, pas une étape.
      // Le bouton « retour » du navigateur doit ramener à la page précédente,
      // pas rejouer une recherche déjà aboutie.
      router.replace(`/commande/suivi/${_id}`);
    } catch (err) {
      // Le 404 du backend porte déjà le bon message, volontairement identique
      // pour tous les cas d'échec.
      setError(
        getApiErrorMessage(
          err,
          "Impossible de retrouver cette commande pour le moment.",
        ),
      );
    }
  }

  return (
    // relative z-10 obligatoire : FixedBackground est en z-0, donc positionné,
    // donc peint APRÈS les fonds des éléments non positionnés.
    <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-20 pt-28 sm:pt-32">
      <header className="mb-6 flex flex-col gap-2 text-center">
        <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
          Suivi de commande
        </span>
        <h1 className="font-heading text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          Où en est ma commande ?
        </h1>
        <p className="text-sm leading-relaxed text-foreground/75">
          Entrez le numéro affiché au moment de votre commande, on vous montre
          où elle en est.
        </p>
      </header>

      {/* Le raccourci passe AVANT le formulaire : pour qui revient sur le même
          téléphone, c'est zéro saisie, et il ne doit pas être enterré sous des
          champs à remplir. */}
      {lastOrder && (
        <Link
          href={`/commande/suivi/${lastOrder.id}`}
          className="mb-5 flex min-h-14 items-center gap-3 rounded-2xl border border-accent-green/40 bg-accent-green/10 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-accent-green/20"
        >
          <span
            aria-hidden="true"
            className="icon-[mdi--progress-clock] shrink-0 text-2xl text-accent-green"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading text-sm font-bold text-foreground">
              Votre dernière commande
            </span>
            <span className="tabular-nums text-xs text-foreground/75">
              N° {lastOrder.dailyNumber}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="icon-[mdi--chevron-right] shrink-0 text-xl text-accent-green"
          />
        </Link>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-3xl border border-primary/25 bg-background/70 p-5 backdrop-blur-md dark:bg-primary/10"
      >
        {/* ---------- Restaurant ---------- */}
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 font-heading text-sm font-bold uppercase tracking-wide text-foreground/70">
            Quel restaurant ?
          </legend>

          <div className="grid grid-cols-2 gap-2">
            {STORES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setStore(option);
                  setError(null);
                }}
                aria-pressed={store === option}
                className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border font-heading text-sm font-bold backdrop-blur-sm transition-colors ${
                  store === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary/25 bg-background/60 text-foreground/70 hover:border-primary/50"
                }`}
              >
                <span aria-hidden="true" className="icon-[mdi--map-marker] text-lg" />
                {STORE_LABELS[option]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ---------- Numéro ---------- */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="dailyNumber"
            className="font-heading text-sm font-bold text-foreground"
          >
            Numéro de commande
          </label>
          {/* inputMode numeric : le clavier du téléphone s'ouvre sur les
              chiffres. type="text" et non "number" — celui-ci fait apparaître
              des flèches inutiles et se laisse remplir de "e", "+" ou ".". */}
          <input
            id="dailyNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={dailyNumber}
            onChange={(event) => {
              setDailyNumber(event.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            placeholder="Ex : 12"
            maxLength={4}
            className="tabular-nums h-16 w-full rounded-xl border border-primary/25 bg-background/85 px-4 text-center font-heading text-3xl font-bold text-foreground outline-none transition-colors placeholder:font-body placeholder:text-lg placeholder:font-normal placeholder:text-foreground/35 focus:border-primary"
          />
          <p className="text-xs text-foreground/45">
            C&apos;est le grand numéro affiché après validation de votre
            commande.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-accent-bordeaux/10 px-4 py-3 text-sm font-semibold text-accent-bordeaux backdrop-blur-sm"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isFetching}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 font-heading text-base font-bold text-on-primary transition-all hover:bg-accent-slate active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
        >
          {isFetching ? (
            <>
              <span
                aria-hidden="true"
                className="icon-[mdi--loading] animate-spin text-xl"
              />
              Recherche…
            </>
          ) : (
            <>
              Voir ma commande
              <span
                aria-hidden="true"
                className="icon-[line-md--arrow-right-circle-twotone] text-xl"
              />
            </>
          )}
        </button>
      </form>

      {/* Sortie de secours : seules les commandes en cours sont retrouvables,
          donc quelqu'un qui cherche une commande d'hier n'a rien à faire ici.
          Autant lui dire où appeler plutôt que de le laisser retaper un
          numéro qui ne donnera jamais rien. */}
      <p className="mt-5 text-center text-xs leading-relaxed text-foreground/75">
        Seules les commandes en cours de préparation ou de livraison sont
        consultables ici.{" "}
        <Link href="/contact" className="font-semibold text-primary underline">
          Un souci ? Appelez-nous
        </Link>
      </p>
    </div>
  );
}
