import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  items: Toast[];
}

const initialState: ToastState = { items: [] };

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    toastShown(state, action: PayloadAction<Toast>) {
      state.items.push(action.payload);
    },
    toastDismissed(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toastShown, toastDismissed } = toastSlice.actions;
export default toastSlice.reducer;
