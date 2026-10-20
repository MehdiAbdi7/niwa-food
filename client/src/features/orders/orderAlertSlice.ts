import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface OrderAlertState {
  // Commandes « Nouvelles » déjà vues SUR CET APPAREIL (bouton « Vu » ou fiche
  // ouverte) : la cloche ne sonne plus pour elles. Volontairement local à
  // l'appareil : partager le « Vu » entre la caisse et la cuisine demanderait
  // un champ côté API.
  acknowledgedIds: string[];
  // Faux tant que la liste n'a pas été relue depuis localStorage. Sans ce
  // drapeau, un rechargement ferait sonner une fois toutes les commandes
  // déjà vues, le temps de relire le disque.
  isHydrated: boolean;
}

const initialState: OrderAlertState = { acknowledgedIds: [], isHydrated: false };

const orderAlertSlice = createSlice({
  name: "orderAlert",
  initialState,
  reducers: {
    acknowledgedHydrated(state, action: PayloadAction<string[]>) {
      state.acknowledgedIds = action.payload;
      state.isHydrated = true;
    },
    ordersAcknowledged(state, action: PayloadAction<string[]>) {
      const known = new Set(state.acknowledgedIds);
      action.payload.forEach((id) => known.add(id));
      state.acknowledgedIds = [...known];
    },
    // Une commande ne revient jamais en « Nouvelles » une fois sortie (voir
    // ALLOWED_TRANSITIONS côté backend) : son identifiant ne sert plus à rien.
    // Sans ce ménage, la liste grossirait à chaque service dans localStorage.
    acknowledgedPruned(state, action: PayloadAction<string[]>) {
      const pending = new Set(action.payload);
      state.acknowledgedIds = state.acknowledgedIds.filter((id) => pending.has(id));
    },
  },
});

export const { acknowledgedHydrated, ordersAcknowledged, acknowledgedPruned } =
  orderAlertSlice.actions;
export default orderAlertSlice.reducer;
