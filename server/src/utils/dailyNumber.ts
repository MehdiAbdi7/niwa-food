import { Counter } from "../models/counter.js";
import { Store } from "../config/stores.js";
import { toServiceDate } from "./serviceDate.js";

export interface CounterState {
  store: Store;
  value: number;
  lastResetAt: Date | null;
}

/**
 * Ce que la création d'une commande a besoin de connaître du service courant.
 *
 * `getNextOrderNumber` ne renvoyait qu'un entier, ce qui obligeait le
 * contrôleur à relire le compteur pour connaître l'heure d'ouverture — deux
 * requêtes, et surtout une fenêtre où un autre poste peut ouvrir un nouveau
 * service entre les deux, ce qui daterait la commande du mauvais service.
 * Le `findOneAndUpdate` ci-dessous est atomique : le numéro et l'heure
 * d'ouverture proviennent du MÊME instantané du document.
 */
export interface IssuedOrderNumber {
  dailyNumber: number;
  serviceStartedAt: Date;
  serviceDate: Date;
}

const counterKey = (store: Store) => `orderCounter:${store}`;

/**
 * Réserve un numéro de commande et date la journée commerciale associée.
 *
 * Numérotation séquentielle propre à chaque magasin, volontairement NON
 * réinitialisée par date : le service déborde sur le lendemain, c'est donc le
 * staff qui ouvre un nouveau service manuellement.
 */
export async function issueOrderNumber(
  store: Store,
): Promise<IssuedOrderNumber> {
  const now = new Date();

  const counter = await Counter.findOneAndUpdate(
    { key: counterKey(store) },
    { $inc: { value: 1 }, $setOnInsert: { lastResetAt: now } },
    { new: true, upsert: true },
  );

  // Repli sur `now` : un compteur créé avant l'ajout de `lastResetAt` peut
  // encore l'avoir à null en base. Mieux vaut dater la commande d'aujourd'hui
  // que de la laisser sans journée commerciale.
  const serviceStartedAt = counter.lastResetAt ?? now;

  return {
    dailyNumber: counter.value,
    serviceStartedAt,
    serviceDate: toServiceDate(serviceStartedAt),
  };
}

/** Ouvre un nouveau service : numérotation à zéro et heure d'ouverture figée. */
export async function resetOrderCounter(store: Store): Promise<CounterState> {
  const counter = await Counter.findOneAndUpdate(
    { key: counterKey(store) },
    { $set: { value: 0, lastResetAt: new Date() } },
    { new: true, upsert: true },
  );

  return { store, value: counter.value, lastResetAt: counter.lastResetAt };
}

export async function getCounterState(store: Store): Promise<CounterState> {
  const counter = await Counter.findOne({ key: counterKey(store) });

  return {
    store,
    value: counter?.value ?? 0,
    lastResetAt: counter?.lastResetAt ?? null,
  };
}
