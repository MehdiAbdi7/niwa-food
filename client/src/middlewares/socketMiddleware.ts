import type { Middleware, UnknownAction } from "@reduxjs/toolkit";
import type { Socket } from "socket.io-client";
import { sessionLoaded, sessionCleared } from "@/features/auth/authSlice";

// Une seule instance pour toute la session, ouverte/fermée sur login/logout —
// pas de reconnexion à chaque action Redux.
let socket: Socket | null = null;

// Vrai pendant le téléchargement du module temps réel : il arrive après
// coup, il ne faut ni en lancer un second, ni ouvrir un socket pour une
// session déjà fermée entre-temps.
let isOpening = false;

function disconnect() {
  socket?.disconnect();
  socket = null;
}

export const socketMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action as UnknownAction);
  const typedAction = action as UnknownAction;

  // Ouverture : le user vient d'être posé (login, ou arrivée sur le dashboard
  // avec une session déjà valide). Un payload null signifie « pas connecté ».
  if (sessionLoaded.match(typedAction)) {
    const user = typedAction.payload;

    if (!user) {
      disconnect();
      return result;
    }

    // `socket` et non `socket?.connected` : pendant le handshake, `connected`
    // vaut encore false. Un second sessionLoaded qui tombait dans cette
    // fenêtre créait un DEUXIÈME io() et écrasait la référence du premier,
    // qui restait ouvert sans que personne ne puisse plus le fermer.
    // isOpening couvre la même fenêtre, un cran plus tôt : pendant le
    // téléchargement du module.
    if (socket || isOpening) return result;
    isOpening = true;

    // import() dynamique : socket.io-client et ses dépendances forment un
    // fichier JavaScript séparé, téléchargé seulement ici, à la connexion du
    // personnel. Les pages publiques ne le chargent plus jamais.
    import("./realtimeConnection")
      .then(({ openRealtimeConnection }) => {
        // La session a pu être fermée pendant le téléchargement.
        if (!store.getState().auth.user) return;
        socket = openRealtimeConnection(store, user);
      })
      .finally(() => {
        isOpening = false;
      });
  }

  if (sessionCleared.match(typedAction)) {
    disconnect();
  }

  return result;
};
