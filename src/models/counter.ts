import { Schema, model, Document } from "mongoose";

interface ICounter extends Document {
  key: string;
  value: number;
  lastResetAt: Date | null;
}

const counterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
  // Horodatage de l'ouverture du service courant.
  // Sert de borne basse partout où on parle du "service en cours" : le service
  // peut dépasser minuit, donc on ne peut pas se baser sur la date calendaire.
  lastResetAt: { type: Date, default: null },
});

export const Counter = model<ICounter>("Counter", counterSchema);
