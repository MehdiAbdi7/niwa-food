import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NavbarState {
  isScrolled: boolean;
  isMenuOpen: boolean;
}

const initialState: NavbarState = {
  isScrolled: false,
  isMenuOpen: false,
};

const navbarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    setIsScrolled(state, action: PayloadAction<boolean>) {
      state.isScrolled = action.payload;
    },
    toggleMenu(state) {
      state.isMenuOpen = !state.isMenuOpen;
    },
    closeMenu(state) {
      state.isMenuOpen = false;
    },
  },
});

export const { setIsScrolled, toggleMenu, closeMenu } = navbarSlice.actions;
export default navbarSlice.reducer;
