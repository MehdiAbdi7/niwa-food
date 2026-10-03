import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/user";

// Plus aucune clé de stockage : le token vit dans un cookie httpOnly que le
// JavaScript ne peut pas lire, et le user est fourni par le serveur au rendu.
// C'est tout l'intérêt du changement — il n'y a plus rien de sensible côté
// client à voler.

type AuthStatus = "idle" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Posé une seule fois par le layout dashboard, avec le user déjà résolu
    // côté serveur. Le status ne reste "idle" que sur les pages publiques,
    // là où personne ne le consulte.
    sessionLoaded(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },

    // Après PATCH /auth/me : la sidebar et la topbar reflètent le nouveau nom
    // sans recharger la page.
    currentUserUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },

    sessionCleared(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
});

export const { sessionLoaded, currentUserUpdated, sessionCleared } =
  authSlice.actions;

export default authSlice.reducer;
