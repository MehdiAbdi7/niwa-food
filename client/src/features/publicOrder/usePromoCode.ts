"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLazyValidatePromoCodeQuery } from "./publicOrderApi";
import { getApiErrorMessage } from "@/lib/apiError";
import { normalizePromoCode, type PromoValidation } from "@/types/promoCode";
import type { OrderType } from "@/types/order";

interface UsePromoCodeArgs {
  /** Total des articles, hors livraison. Le backend valide sur le sien. */
  itemsTotal: number;
  orderType: OrderType;
}

export interface UsePromoCodeResult {
  /** Ce que le client tape, valeur brute — jamais retardée. */
  input: string;
  setInput: (value: string) => void;

  /** Code accepté, ou null. `applied.code` est ce qu'on envoie à la commande. */
  applied: PromoValidation | null;
  /** Remise en DA, 0 si aucun code. Aperçu — le backend recalcule. */
  discountAmount: number;

  error: string | null;
  isChecking: boolean;

  apply: () => Promise<void>;
  clear: () => void;
}

/**
 * Vérification et suivi d'un code promo pendant la saisie de la commande.
 *
 * DEUX RESPONSABILITÉS, et la seconde est celle qu'on oublie :
 *   1. vérifier le code au moment où le client le soumet
 *   2. le REVÉRIFIER dès que le panier ou le mode de service change
 *
 * Sans (2), un code réservé à la livraison resterait affiché après un passage
 * en « à emporter », et le client découvrirait le refus à l'envoi — au pire
 * moment, sur l'écran où il a le moins envie de comprendre quoi que ce soit.
 *
 * Le montant affiché reste un APERÇU : c'est le backend qui recalcule la
 * remise sur les prix résolus en base au moment de créer la commande.
 */
export function usePromoCode({
  itemsTotal,
  orderType,
}: UsePromoCodeArgs): UsePromoCodeResult {
  const [validate] = useLazyValidatePromoCodeQuery();

  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<PromoValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Le code appliqué, sous forme de PRIMITIVE : mis en dépendance d'effet,
  // l'objet `applied` relancerait la revalidation à chaque réponse reçue,
  // laquelle produirait un nouvel objet, donc une boucle sans fin.
  const appliedCode = applied?.code ?? null;

  // Évite d'écrire le résultat d'une vérification que le client a déjà
  // remplacée : deux frappes rapprochées, deux requêtes, et la plus lente
  // arrive en dernier.
  const requestIdRef = useRef(0);

  const apply = useCallback(async () => {
    const code = normalizePromoCode(input);

    if (code.length < 2) {
      setError("Entrez votre code promo");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsChecking(true);
    setError(null);

    try {
      const result = await validate({
        code,
        itemsTotal,
        orderType,
      }).unwrap();

      if (requestId !== requestIdRef.current) return;

      setApplied(result);
      setInput("");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setApplied(null);
      // Le backend distingue déjà ce qui est actionnable (« à partir de
      // 2 000 DA ») de ce qui ne l'est pas (« code non valide ») : on affiche
      // son message tel quel plutôt que d'en inventer un second.
      setError(getApiErrorMessage(err, "Ce code promo n'est pas valide"));
    } finally {
      if (requestId === requestIdRef.current) setIsChecking(false);
    }
  }, [input, itemsTotal, orderType, validate]);

  const clear = useCallback(() => {
    // Invalide toute vérification en vol : sans ça, une réponse en retard
    // réappliquerait le code que le client vient de retirer.
    requestIdRef.current += 1;
    setApplied(null);
    setError(null);
    setInput("");
  }, []);

  /**
   * Revalidation automatique.
   *
   * Le setState vit dans une continuation asynchrone, pas dans le corps de
   * l'effet : aucun rendu supplémentaire n'est déclenché au montage, et la
   * règle react-hooks/set-state-in-effect ne s'applique pas.
   */
  useEffect(() => {
    if (!appliedCode) return;

    let cancelled = false;

    validate({ code: appliedCode, itemsTotal, orderType })
      .unwrap()
      .then((result) => {
        if (cancelled) return;
        // Le montant a pu changer sans que le code cesse d'être valide : le
        // client vient d'ajouter un burger, sa remise suit.
        setApplied(result);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setApplied(null);
        setError(
          getApiErrorMessage(
            err,
            "Votre code promo ne s'applique plus à cette commande",
          ),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [appliedCode, itemsTotal, orderType, validate]);

  return {
    input,
    setInput,
    applied,
    discountAmount: applied?.discountAmount ?? 0,
    error,
    isChecking,
    apply,
    clear,
  };
}
