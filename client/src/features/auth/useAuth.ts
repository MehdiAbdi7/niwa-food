"use client";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { sessionCleared, sessionLoaded } from "./authSlice";
import { useLoginMutation, useLogoutMutation } from "./authApi";
import { api } from "@/server/api";

/**
 * Page d'accueil d'un rôle, après connexion ou déconnexion.
 *
 * Un livreur n'a rien à faire sur /dashboard : le layout l'en chasserait, mais
 * autant l'envoyer directement au bon endroit plutôt que de lui faire traverser
 * une redirection.
 */
export function getHomePathForRole(role?: string): string {
  return role === "delivery" ? "/livraison" : "/dashboard";
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  async function login(email: string, password: string) {
    const loggedUser = await loginMutation({ email, password }).unwrap();
    dispatch(sessionLoaded(loggedUser));
    return loggedUser;
  }

  async function logout() {
    try {
      // Le cookie est httpOnly : seul le serveur peut l'effacer. Un simple
      // reset du state Redux laisserait la session bien vivante côté API.
      await logoutMutation().unwrap();
    } finally {
      dispatch(sessionCleared());
      // Vide le cache RTK Query : sans ça, les commandes du compte précédent
      // resteraient affichées une fraction de seconde à la connexion suivante.
      dispatch(api.util.resetApiState());
      // refresh() force les Server Components à se re-rendre avec la session
      // effacée, sinon Next resservirait le rendu mis en cache.
      router.replace("/login");
      router.refresh();
    }
  }

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isAdmin: user?.role === "admin",
    isDelivery: user?.role === "delivery",
    // « Travaille dans le restaurant », admin compris — même définition que
    // le middleware isStaff côté backend. À utiliser pour masquer ce qu'un
    // livreur ne doit pas voir : c'est l'API qui protège réellement, ceci
    // évite seulement d'afficher un bouton qui répondrait 403.
    isStaff: user?.role === "admin" || user?.role === "employee",
    login,
    logout,
    isLoginLoading,
  };
}
