"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  cartCleared,
  cartReconciled,
  lineAdded,
  lineQuantityChanged,
  lineRemoved,
  lineReplaced,
  noticeDismissed,
  productSheetClosed,
  productSheetOpened,
  selectCartCount,
  selectCartLines,
  selectCartTotal,
  selectIsCartHydrated,
  selectQuantityByItem,
  selectUnavailableNotice,
  ticketClosed,
  ticketOpened,
} from "./cartSlice";
import type { NewCartLine } from "@/lib/cartLine";

export function useCart() {
  const dispatch = useAppDispatch();

  return {
    lines: useAppSelector(selectCartLines),
    count: useAppSelector(selectCartCount),
    total: useAppSelector(selectCartTotal),
    quantityByItem: useAppSelector(selectQuantityByItem),
    isHydrated: useAppSelector(selectIsCartHydrated),
    unavailableNotice: useAppSelector(selectUnavailableNotice),

    addLine: (line: NewCartLine) => dispatch(lineAdded(line)),
    replaceLine: (previousKey: string, line: NewCartLine) =>
      dispatch(lineReplaced({ previousKey, line })),
    removeLine: (key: string) => dispatch(lineRemoved(key)),
    setQuantity: (key: string, quantity: number) =>
      dispatch(lineQuantityChanged({ key, quantity })),
    clear: () => dispatch(cartCleared()),

    reconcile: (availableIds: string[]) =>
      dispatch(cartReconciled(availableIds)),
    dismissNotice: () => dispatch(noticeDismissed()),

    openProduct: (menuItemId: string, lineKey: string | null = null) =>
      dispatch(productSheetOpened({ menuItemId, lineKey })),
    closeProduct: () => dispatch(productSheetClosed()),
    openTicket: () => dispatch(ticketOpened()),
    closeTicket: () => dispatch(ticketClosed()),
  };
}
