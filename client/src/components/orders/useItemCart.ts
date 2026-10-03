"use client";

import { useState } from "react";
import {
  buildCartLineKey,
  countCartItems,
  getLineUnitPrice,
  sumCartTotal,
  toOrderItemsPayload,
  type CartLine,
  type NewCartLine,
} from "@/lib/cartLine";

// La logique (clé de fusion, prix unitaire, payload) vit désormais dans
// lib/cartLine.ts, partagée avec le panier client Redux : une seule règle de
// fusion et un seul calcul de prix pour toute l'app.
// Ces ré-exports gardent les imports existants du dashboard intacts.
export { getLineUnitPrice };
export type {
  CartLine,
  CartExtra,
  CartFormula,
  NewCartLine,
} from "@/lib/cartLine";

export function useItemCart() {
  const [cart, setCart] = useState<CartLine[]>([]);

  function addLine(newLine: NewCartLine) {
    const key = buildCartLineKey(newLine);

    setCart((prev) => {
      const existing = prev.find((line) => line.key === key);

      if (existing) {
        return prev.map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + newLine.quantity }
            : line,
        );
      }

      return [...prev, { ...newLine, key }];
    });
  }

  function addToCart(newLine: NewCartLine) {
    addLine(newLine);
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((line) => line.key !== key));
  }

  function setQuantity(key: string, quantity: number) {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.key !== key)
        : prev.map((line) => (line.key === key ? { ...line, quantity } : line)),
    );
  }

  function clearCart() {
    setCart([]);
  }

  return {
    cart,
    addLine,
    addToCart,
    removeFromCart,
    setQuantity,
    clearCart,
    toPayload: () => toOrderItemsPayload(cart),
    itemsCount: countCartItems(cart),
    total: sumCartTotal(cart),
  };
}
