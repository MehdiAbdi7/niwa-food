import { Counter } from "../models/counter.js";
import { Store } from "../config/stores.js";

export async function getNextOrderNumber(store: Store): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key: `orderCounter:${store}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  );

  return counter.value;
}

export async function resetOrderCounter(store: Store): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key: `orderCounter:${store}` },
    { $set: { value: 0 } },
    { new: true, upsert: true },
  );

  return counter.value;
}
