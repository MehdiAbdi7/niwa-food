"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/features/auth/useAuth";
import { useTheme } from "@/features/theme/useTheme";
import { useToast } from "@/features/toast/useToast";
import {
  useGetStoreStatusesQuery,
  useUpdateStoreStatusMutation,
} from "@/features/storeSettings/storeStatusApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { STORE_LABELS } from "@/types/store";
import type { ThemeMode } from "@/features/theme/themeSlice";
import type { StoreStatus } from "@/types/storeStatus";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: "Clair", icon: "icon-[mdi--white-balance-sunny]" },
  { value: "dark", label: "Sombre", icon: "icon-[mdi--moon-waning-crescent]" },
  { value: "system", label: "Auto", icon: "icon-[mdi--theme-light-dark]" },
];

/**
 * Interrupteur rapide des commandes en ligne, pour UN magasin.
 *
 * Volontairement sans champ message, contrairement à OrderIntakeCard : ce menu
 * sert au geste d'urgence en plein coup de feu (rupture, rush), pas à la
 * rédaction. Le message personnalisé reste dans Paramètres, dont le lien est
 * juste en dessous.
 */
function StoreToggle({ status }: { status: StoreStatus }) {
  const [updateStatus, { isLoading }] = useUpdateStoreStatusMutation();
  const toast = useToast();

  async function apply(acceptingOrders: boolean) {
    try {
      await updateStatus({
        store: status.store,
        acceptingOrders,
        // Toujours transmis, y compris à null : sans ça, le message de la
        // fermeture précédente resterait collé à celle-ci (voir setStoreStatus
        // côté backend).
        closedMessage: null,
      }).unwrap();

      toast.success(
        acceptingOrders
          ? `Commandes rouvertes — ${STORE_LABELS[status.store]}`
          : `Commandes fermées — ${STORE_LABELS[status.store]}`,
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier l'état des commandes"),
      );
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold text-foreground">
          {STORE_LABELS[status.store]}
        </span>
        <span
          className={`text-xs font-semibold ${
            status.acceptingOrders
              ? "text-accent-green"
              : "text-accent-bordeaux"
          }`}
        >
          {status.acceptingOrders ? "Ouvert aux commandes" : "Fermé"}
        </span>
      </div>

      {/* Pas de désactivation pendant la requête : on s'appuie sur
          l'invalidation du tag, qui remet l'état réel du serveur. */}
      <Switch
        checked={status.acceptingOrders}
        onChange={(next) => {
          if (isLoading) return;
          apply(next);
        }}
      />
    </div>
  );
}

/**
 * Menu de compte de la topbar.
 *
 * Regroupe ce qui était éparpillé (profil et déconnexion en bas de sidebar,
 * donc invisibles sur mobile ; ouverture des commandes enterrée dans
 * Paramètres) en un seul point d'accès, présent à toutes les tailles d'écran.
 */
export function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const { mode, setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  // Tant que le menu n'a jamais été ouvert, inutile d'aller chercher l'état
  // des magasins : c'est un appel de plus au chargement de CHAQUE page du
  // dashboard, pour une information que personne ne regarde encore.
  const [hasOpened, setHasOpened] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: statuses } = useGetStoreStatusesQuery(undefined, {
    skip: !hasOpened,
  });

  // Un employee ne voit que son magasin : le backend lui imposerait le sien de
  // toute façon (resolveTargetStore), afficher l'autre serait une promesse en
  // l'air.
  const visibleStatuses = (statuses ?? []).filter(
    (status) => isAdmin || status.store === user?.store,
  );

  useEffect(() => {
    if (!isOpen) return;

    // mousedown et non click : le menu doit se fermer AVANT que le clic
    // n'atteigne l'élément visé, sinon un bouton situé sous le panneau reçoit
    // le clic qui était censé fermer.
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // PAS d'effet de fermeture sur changement de pathname : ce serait un
  // setState dans un effet (que le linter signale à juste titre), et surtout
  // c'est inutile. Le seul lien navigant d'ici ferme lui-même au clic, et un
  // clic sur la sidebar passe déjà par le mousedown extérieur ci-dessus.

  if (!user) return null;

  const initials = `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`;

  function toggle() {
    setHasOpened(true);
    setIsOpen((open) => !open);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu du compte"
        className={`flex h-10 items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 transition-colors ${
          isOpen
            ? "border-primary bg-primary/10"
            : "border-border-subtle bg-surface hover:border-primary"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-xs font-bold uppercase text-primary">
          {initials}
        </span>
        <span
          aria-hidden="true"
          className={`${
            isOpen ? "icon-[mdi--close]" : "icon-[mdi--menu]"
          } text-lg text-foreground/75`}
        />
      </button>

      {isOpen && (
        // max-h + overflow : sur un petit écran en paysage, le panneau serait
        // plus haut que la fenêtre et la déconnexion deviendrait inatteignable.
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 flex max-h-[calc(100dvh-5rem)] w-72 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-2xl border border-border-subtle bg-surface shadow-food-md motion-safe:animate-[toastIn_0.18s_ease-out]"
        >
          {/* ---------- Compte ---------- */}
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold uppercase text-primary">
              {initials}
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate font-heading text-sm font-bold text-foreground">
                {user.firstname} {user.lastname}
              </p>
              <p className="truncate text-xs text-foreground/75">
                {user.email}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-foreground/75">
                {isAdmin ? "Administrateur" : "Employé"}
                {user.store && ` · ${STORE_LABELS[user.store]}`}
              </p>
            </div>
          </div>

          {/* ---------- Commandes en ligne ---------- */}
          <div className="flex flex-col gap-2 border-b border-border-subtle px-4 py-3.5">
            <p className="font-heading text-xs font-bold uppercase tracking-wide text-foreground/45">
              Commandes en ligne
            </p>

            {visibleStatuses.length === 0 ? (
              <p className="text-xs text-foreground/45">Chargement…</p>
            ) : (
              visibleStatuses.map((status) => (
                <StoreToggle key={status.store} status={status} />
              ))
            )}

            <p className="text-xs leading-snug text-foreground/45">
              Coupe seulement la prise de commande côté clients. Vous pouvez
              continuer à saisir au comptoir.
            </p>
          </div>

          {/* ---------- Apparence ---------- */}
          <div className="flex flex-col gap-2 border-b border-border-subtle px-4 py-3.5">
            <p className="font-heading text-xs font-bold uppercase tracking-wide text-foreground/45">
              Apparence
            </p>
            <div className="flex gap-1.5">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={mode === option.value}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                    mode === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-subtle text-foreground/75 hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`${option.icon} text-lg`}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- Liens et sortie ---------- */}
          <div className="flex flex-col p-2">
            <Link
              href="/parametres"
              role="menuitem"
              // Ferme ici plutôt que dans un effet sur le pathname : c'est le
              // seul endroit du panneau qui déclenche une navigation.
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <span
                aria-hidden="true"
                className="icon-[mdi--cog-outline] text-lg"
              />
              Paramètres et service
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent-bordeaux transition-colors hover:bg-accent-bordeaux/10"
            >
              <span aria-hidden="true" className="icon-[mdi--logout] text-lg" />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
