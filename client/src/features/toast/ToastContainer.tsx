"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toastDismissed, type Toast } from "./toastSlice";

const AUTO_DISMISS_MS = 4000;

const VARIANT_STYLES: Record<Toast["variant"], string> = {
  success: "border-accent-green/40 text-accent-green",
  error: "border-accent-bordeaux/40 text-accent-bordeaux",
  info: "border-primary/40 text-foreground",
};

const VARIANT_ICONS: Record<Toast["variant"], string> = {
  success: "icon-[mdi--check-circle]",
  error: "icon-[mdi--alert-circle]",
  info: "icon-[mdi--information]",
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(
      () => dispatch(toastDismissed(toast.id)),
      AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border bg-surface px-4 py-3 shadow-food-sm ${VARIANT_STYLES[toast.variant]}`}
      style={{ animation: "toastIn 0.25s ease-out" }}
      role="status"
    >
      <span className={`${VARIANT_ICONS[toast.variant]} text-xl shrink-0`} />
      <p className="text-sm font-semibold text-foreground">{toast.message}</p>
      <button
        onClick={() => dispatch(toastDismissed(toast.id))}
        aria-label="Fermer la notification"
        className="ml-1 text-foreground/40 hover:text-foreground"
      >
        <span className="icon-[mdi--close] text-base" />
      </button>
    </div>
  );
}

// Monté une seule fois dans le layout dashboard, en position fixe.
export function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.items);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
