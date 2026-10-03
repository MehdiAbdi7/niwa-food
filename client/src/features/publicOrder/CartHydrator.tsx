"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { readStoredCart } from "@/lib/cartStorage";
import { cartRestored } from "./cartSlice";

/**
 * Réinjecte dans Redux le panier sauvegardé au passage précédent.
 *
 * La lecture est dans un useEffect, jamais pendant le rendu : localStorage
 * n'existe pas côté serveur, et lire une valeur différente au premier rendu
 * client produirait une erreur d'hydratation React. L'état initial vide est
 * donc rendu à l'identique des deux côtés, puis remplacé juste après.
 *
 * Monté dans le layout public et non dans /commande : le bouton panier de la
 * navbar est présent sur toutes les pages, il doit afficher le bon compte dès
 * l'accueil.
 */
export function CartHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Le tableau vide est volontaire : il n'y a peut-être rien à restaurer,
    // mais il faut quand même signaler que l'hydratation a eu lieu, sinon le
    // listener n'écrira jamais rien.
    dispatch(cartRestored(readStoredCart() ?? []));
  }, [dispatch]);

  return null;
}
