// src/lib/store.ts

import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../features/theme/themeSlice";
import heroCarouselReducer from "../features/heroCarousel/heroCarouselSlice";
import navbarReducer from "../features/navbar/navbarSlice";
import testimonialsReducer from "../features/testimonials/testimonialsSlice";
import authReducer from "../features/auth/authSlice";
import toastReducer from "../features/toast/toastSlice";
import storeScopeReducer from "../features/store/storeScopeSlice";
import publicCartReducer from "../features/publicOrder/cartSlice";
import menuBrowseReducer from "../features/publicOrder/browseSlice";
import { cartListener } from "../features/publicOrder/cartListener";
import { api } from "@/server/api";
import { socketMiddleware } from "@/middlewares/socketMiddleware";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    heroCarousel: heroCarouselReducer,
    navbar: navbarReducer,
    testimonials: testimonialsReducer,
    auth: authReducer,
    toast: toastReducer,
    storeScope: storeScopeReducer,
    publicCart: publicCartReducer,
    menuBrowse: menuBrowseReducer,
    [api.reducerPath]: api.reducer,
  },
  // prepend et non concat pour le listener : c'est la position recommandée
  // par RTK, elle garantit que l'effet voit l'action avant tout middleware
  // susceptible de la transformer.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(cartListener.middleware)
      .concat(api.middleware, socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
