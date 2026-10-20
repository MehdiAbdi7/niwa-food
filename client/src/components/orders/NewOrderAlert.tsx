"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useAuth } from "@/features/auth/useAuth";
import { usePendingOrders } from "@/features/orders/usePendingOrders";
import {
  acknowledgedHydrated,
  acknowledgedPruned,
  ordersAcknowledged,
} from "@/features/orders/orderAlertSlice";
import {
  isAudioBlocked,
  playNewOrderBell,
  subscribeAudioState,
  unlockAudio,
} from "@/lib/orderAlertSound";
import { STORE_LABELS } from "@/types/store";

// Rappel tant qu'une commande n'a pas été vue : assez espacé pour ne pas
// rendre la cuisine folle, assez proche pour qu'une commande ne dorme pas.
const REPEAT_INTERVAL_MS = 30_000;

const STORAGE_KEY = "niwa_acknowledged_orders";

// Gestes qui comptent comme une « interaction » pour le navigateur. touchend
// en plus de click : sur iPad, toucher une zone non cliquable ne déclenche
// pas toujours de click.
const UNLOCK_EVENTS = ["click", "touchend", "keydown"] as const;

function readAcknowledged(): string[] {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    // Donnée venue du disque, donc de l'extérieur : on vérifie la forme
    // avant de s'en servir, comme pour le panier (lib/cartStorage.ts).
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeAcknowledged(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Navigation privée ou stockage plein : le « Vu » tiendra seulement
    // jusqu'au prochain rechargement. Pas de quoi bloquer l'alerte.
  }
}

/**
 * Alerte des nouvelles commandes, montée UNE fois dans le layout du
 * dashboard : elle sonne sur toutes les pages, pas seulement sur /commandes,
 * et pour tous les magasins de l'utilisateur (voir usePendingOrders).
 *
 * La cloche sonne à l'arrivée d'une commande, puis toutes les 30 s, jusqu'à
 * ce que la commande soit vue (bouton « Vu » ou fiche ouverte, voir
 * OrderDetailModal) ou qu'elle quitte la colonne « Nouvelles ».
 */
export function NewOrderAlert() {
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const { pendingOrders, isSuccess } = usePendingOrders();
  const { acknowledgedIds, isHydrated } = useAppSelector(
    (state) => state.orderAlert,
  );

  // useSyncExternalStore : l'état du son vit dans l'AudioContext, hors de
  // React. Côté serveur, il n'y a pas de son, donc rien de bloqué.
  const audioBlocked = useSyncExternalStore(
    subscribeAudioState,
    isAudioBlocked,
    () => false,
  );

  const unseenOrders = pendingOrders.filter(
    (order) => !acknowledgedIds.includes(order._id),
  );

  // Des chaînes plutôt que des tableaux dans les dépendances des effets :
  // un nouveau tableau à chaque rendu relancerait l'effet, et donc le
  // minuteur de 30 s, en permanence.
  const unseenKey = unseenOrders.map((order) => order._id).join(",");
  const pendingKey = pendingOrders.map((order) => order._id).join(",");

  // Relit les « Vu » de cet appareil, une seule fois au montage.
  useEffect(() => {
    dispatch(acknowledgedHydrated(readAcknowledged()));
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) writeAcknowledged(acknowledgedIds);
  }, [isHydrated, acknowledgedIds]);

  // Oublie les commandes sorties de « Nouvelles » : elles n'y reviendront pas.
  useEffect(() => {
    if (!isHydrated || !isSuccess) return;
    dispatch(acknowledgedPruned(pendingKey ? pendingKey.split(",") : []));
  }, [dispatch, isHydrated, isSuccess, pendingKey]);

  // Le navigateur n'accepte de débloquer le son que pendant un geste de
  // l'utilisateur : on écoute le premier, n'importe où sur la page.
  useEffect(() => {
    if (!audioBlocked) return;
    UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, unlockAudio));
    return () =>
      UNLOCK_EVENTS.forEach((type) =>
        window.removeEventListener(type, unlockAudio),
      );
  }, [audioBlocked]);

  // Ce que l'effet précédent a vu : sert à distinguer une VRAIE nouvelle
  // commande (sonner tout de suite) d'un simple nouveau rendu.
  const lastRun = useRef<{ ids: Set<string>; audioBlocked: boolean } | null>(
    null,
  );
  const isReady = isHydrated && isSuccess;

  useEffect(() => {
    // Rien avant d'avoir relu les « Vu » ET reçu la liste : sinon toutes les
    // commandes déjà vues sonneraient une fois à chaque rechargement.
    if (!isReady) return;

    const ids = unseenKey ? unseenKey.split(",") : [];
    const previous = lastRun.current;
    lastRun.current = { ids: new Set(ids), audioBlocked };

    if (ids.length === 0) return;

    const hasNewOrder = ids.some((id) => !previous?.ids.has(id));
    // Son débloqué à l'instant, avec des commandes en attente : on sonne
    // sans attendre le prochain rappel, qui peut être 30 s plus loin.
    const justUnlocked = previous?.audioBlocked === true && !audioBlocked;
    if (hasNewOrder || justUnlocked) playNewOrderBell();

    const timer = window.setInterval(playNewOrderBell, REPEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isReady, unseenKey, audioBlocked]);

  if (!audioBlocked && unseenOrders.length === 0) return null;

  const count = unseenOrders.length;
  const plural = count > 1 ? "s" : "";
  // Les numéros du jour repartent de 1 dans chaque magasin : pour l'admin,
  // qui voit les deux, « #12 » seul serait ambigu.
  const orderLabels = unseenOrders
    .map((order) =>
      isAdmin
        ? `#${order.dailyNumber} ${STORE_LABELS[order.store]}`
        : `#${order.dailyNumber}`,
    )
    .join(" · ");

  return (
    // top-20 : juste sous la Topbar collante. z-30 : au-dessus du contenu,
    // sous la Topbar (z-40) et les modales, comme le prévoit l'échelle du
    // projet (voir Topbar.tsx). Les toasts gardent le coin bas droit.
    <div className="fixed inset-x-4 top-20 z-30 flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm">
      {audioBlocked && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-4 py-3 shadow-food-sm"
        >
          <span className="icon-[mdi--volume-off] shrink-0 text-xl text-accent-bordeaux" />
          <p className="text-sm font-semibold text-foreground">
            {"Son bloqué par le navigateur : touche l'écran pour activer les alertes."}
          </p>
        </div>
      )}

      {count > 0 && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border-2 border-primary bg-surface px-4 py-3 shadow-food-sm"
        >
          <span className="icon-[mdi--bell-ring-outline] shrink-0 text-2xl text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-bold text-foreground">
              {count} nouvelle{plural} commande{plural}
            </p>
            <p className="truncate text-xs text-foreground/75">{orderLabels}</p>
          </div>
          <Button
            onClick={() =>
              dispatch(ordersAcknowledged(unseenOrders.map((order) => order._id)))
            }
          >
            Vu
          </Button>
        </div>
      )}
    </div>
  );
}
