import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

interface MenuBrowseState {
  search: string;
  /**
   * Section actuellement sous les yeux du client.
   *
   * Changement de sens par rapport à la version précédente : ce n'est PLUS un
   * filtre choisi au clic, c'est une position de lecture, écrite par le scroll
   * (voir useSectionSpy). La carte s'affiche désormais en entier — cliquer une
   * catégorie y fait défiler au lieu de masquer les autres.
   *
   * Pourquoi : sur 35 produits, filtrer cache 30 plats à quelqu'un qui n'a pas
   * encore décidé ce qu'il veut manger. Un menu de fast-food se parcourt, il ne
   * s'interroge pas.
   */
  activeGroup: string | null;
  /** Sous-section active (Classique / Signature, Sauce rouge / blanche...). */
  activeSubKey: string | null;
}

const initialState: MenuBrowseState = {
  search: "",
  activeGroup: null,
  activeSubKey: null,
};

const browseSlice = createSlice({
  name: "menuBrowse",
  initialState,
  reducers: {
    searchChanged(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },

    // Une seule action pour les deux niveaux : dispatcher séparément
    // produirait un rendu intermédiaire où le groupe a changé mais pas encore
    // sa sous-section, donc une pastille qui saute.
    activeAnchorChanged(
      state,
      action: PayloadAction<{ group: string | null; subKey: string | null }>,
    ) {
      state.activeGroup = action.payload.group;
      state.activeSubKey = action.payload.subKey;
    },

    filtersReset(state) {
      state.search = "";
    },
  },
});

export const { searchChanged, activeAnchorChanged, filtersReset } =
  browseSlice.actions;

export default browseSlice.reducer;

export const selectSearch = (state: RootState) => state.menuBrowse.search;
export const selectActiveGroup = (state: RootState) =>
  state.menuBrowse.activeGroup;
export const selectActiveSubKey = (state: RootState) =>
  state.menuBrowse.activeSubKey;
