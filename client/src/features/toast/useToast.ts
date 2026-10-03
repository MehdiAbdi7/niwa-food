"use client";

import { useAppDispatch } from "@/lib/hooks";
import { toastShown, type ToastVariant } from "./toastSlice";

export function useToast() {
  const dispatch = useAppDispatch();

  function showToast(message: string, variant: ToastVariant = "info") {
    dispatch(
      toastShown({ id: crypto.randomUUID(), variant, message }),
    );
  }

  return {
    success: (message: string) => showToast(message, "success"),
    error: (message: string) => showToast(message, "error"),
    info: (message: string) => showToast(message, "info"),
  };
}
