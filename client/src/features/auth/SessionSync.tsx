"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { sessionLoaded } from "./authSlice";
import type { User } from "@/types/user";

/**
 * Pousse dans Redux la session déjà résolue par le layout serveur.
 *
 * Le dispatch est dans un useEffect, pas pendant le rendu : Redux notifie ses
 * abonnés de façon synchrone, donc dispatcher pendant le rendu revient à
 * mettre à jour d'autres composants (LoginPage, la sidebar...) alors que
 * celui-ci n'a pas fini de se rendre — ce que React signale par
 * « Cannot update a component while rendering a different component ».
 *
 * DÉPENDANCE : la signature, pas l'objet.
 * Le layout serveur reconstruit un objet `user` neuf à CHAQUE rendu (chaque
 * router.refresh(), chaque navigation, chaque revalidation). Sa référence
 * change donc même quand la session est rigoureusement identique. Avec `user`
 * en dépendance, l'effet se redéclenchait à chaque fois et re-dispatchait
 * sessionLoaded — ce qui, via socketMiddleware, refermait et rouvrait le
 * socket en boucle.
 *
 * JSON.stringify donne une dépendance stable PAR VALEUR, et JSON.parse rend un
 * objet équivalent sans avoir à référencer `user` dans l'effet (donc sans
 * closure périmée et sans avertissement du linter).
 */
export function SessionSync({ user }: { user: User | null }) {
  const dispatch = useAppDispatch();
  const signature = JSON.stringify(user ?? null);

  useEffect(() => {
    dispatch(sessionLoaded(JSON.parse(signature) as User | null));
  }, [dispatch, signature]);

  return null;
}
