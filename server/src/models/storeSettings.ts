import { model, Model, Schema } from "mongoose";
import { IStoreSettings } from "../types/models/storeSettings.js";
import { STORES } from "../config/stores.js";

type StoreSettingsModel = Model<IStoreSettings>;

/**
 * Configuration par magasin.
 *
 * Volontairement un modèle à part plutôt qu'un champ de plus sur Counter :
 * celui-ci est une collection clé/valeur technique (`orderCounter:kouba`), pas
 * un endroit où loger du métier. Ce document a vocation à accueillir le reste
 * de ce qui est aujourd'hui en dur dans le front (téléphone, adresse, horaires
 * d'affichage, frais de livraison par défaut).
 *
 * Aucune migration nécessaire : un magasin sans document est considéré ouvert
 * (voir getStoreStatus). Le document n'est créé qu'à la première fermeture.
 */
const storeSettingsSchema = new Schema<IStoreSettings, StoreSettingsModel>(
  {
    store: { type: String, enum: STORES, required: true, unique: true },
    acceptingOrders: { type: Boolean, default: true },
    closedMessage: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

export const StoreSettings = model<IStoreSettings, StoreSettingsModel>(
  "StoreSettings",
  storeSettingsSchema,
);
