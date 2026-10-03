// src/features/testimonials/testimonialsSlice.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface TestimonialsState {
  currentIndex: number;
}

const initialState: TestimonialsState = {
  currentIndex: 0,
};

const testimonialsSlice = createSlice({
  name: "testimonials",
  initialState,
  reducers: {
    nextTestimonial(state, action: PayloadAction<number>) {
      const total = action.payload;
      state.currentIndex = (state.currentIndex + 1) % total;
    },
    prevTestimonial(state, action: PayloadAction<number>) {
      const total = action.payload;
      state.currentIndex = (state.currentIndex - 1 + total) % total;
    },
  },
});

export const { nextTestimonial, prevTestimonial } = testimonialsSlice.actions;
export default testimonialsSlice.reducer;
