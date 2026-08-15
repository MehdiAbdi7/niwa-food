import { Counter } from "../models/counter.js";
import { Store } from "../config/stores.js";

export interface CounterState {
  store: Store;
  value: number;
  lastResetAt: Date | null;
}

const counterKey = (store: Store) => `orderCounter:${store}`;

// Numéro de commande séquentiel, propre à chaque magasin.
// Volontairement NON réinitialisé par date : le service d'un fast-food déborde
// sur le lendemain, c'est donc le staff qui ouvre un nouveau service manuellement.
export async function getNextOrderNumber(store: Store): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key: counterKey(store) },
    { $inc: { value: 1 }, $setOnInsert: { lastResetAt: new Date() } },
    { new: true, upsert: true },
  );

  return counter.value;
}

// Ouvre un nouveau service : remet la numérotation à zéro et fige l'heure d'ouverture
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
