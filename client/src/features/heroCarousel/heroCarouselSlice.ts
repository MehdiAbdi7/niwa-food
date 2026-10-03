import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface HeroCarouselState {
  currentIndex: number;
}

const initialState: HeroCarouselState = {
  currentIndex: 0,
};

const heroCarouselSlice = createSlice({
  name: "heroCarousel",
  initialState,
  reducers: {
    // action.payload = nombre total de slides, pour boucler correctement
    nextHeroSlide(state, action: PayloadAction<number>) {
      const totalSlides = action.payload;
      state.currentIndex = (state.currentIndex + 1) % totalSlides;
    },
    // même logique en sens inverse — on ajoute totalSlides avant le modulo
    // pour éviter un résultat négatif quand currentIndex vaut 0
    prevHeroSlide(state, action: PayloadAction<number>) {
      const totalSlides = action.payload;
      state.currentIndex = (state.currentIndex - 1 + totalSlides) % totalSlides;
    },
  },
});

export const { nextHeroSlide, prevHeroSlide } = heroCarouselSlice.actions;
export default heroCarouselSlice.reducer;
