import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Store } from "@/types/store";

interface StoreScopeState {
  // null = "les deux magasins" — n'a de sens que pour un admin.
  // Un employee ignore cette valeur : son magasin vient de son compte
  // (voir useActiveStore ci-dessous), jamais de ce slice.
  selectedStore: Store | null;
}

const initialState: StoreScopeState = { selectedStore: null };

const storeScopeSlice = createSlice({
  name: "storeScope",
  initialState,
  reducers: {
    storeSelected(state, action: PayloadAction<Store | null>) {
      state.selectedStore = action.payload;
    },
  },
});

export const { storeSelected } = storeScopeSlice.actions;
export default storeScopeSlice.reducer;
