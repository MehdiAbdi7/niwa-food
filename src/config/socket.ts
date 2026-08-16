import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { STORES } from "./stores.js";
import { isAllowedOrigin } from "./cors.js";
import { AUTH_COOKIE_NAME } from "./cookies.js";

export let io: Server;

interface AccessTokenPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Le handshake Socket.IO ne passe pas par cookie-parser (il court-circuite la
// pile de middlewares Express), donc on lit l'en-tête Cookie brut ici.
// Parsing manuel plutôt qu'une dépendance : quatre lignes, et rien à installer.
function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;

    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return undefined;
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      // Même politique que l'API REST (voir config/cors.ts) : sans ça, le
      // socket serait rejeté sur les URLs de preview Vercel alors que les
      // requêtes REST passent — panne du temps réel difficile à diagnostiquer.
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origine non autorisée par CORS : ${origin}`));
        }
      },
      credentials: true,
    },
  });

  // Authentifie la connexion socket. Une connexion sans token reste autorisée
  // (client public qui suit sa commande), mais n'aura pas accès aux rooms
  // "dashboard:*".
  io.use(async (socket, next) => {
    try {
      // Trois sources, par ordre de priorité :
      // - le cookie httpOnly, envoyé automatiquement par le navigateur dès que
      //   le client est créé avec withCredentials: true
      // - handshake.auth.token (clients qui passent le token explicitement)
      // - header Authorization, avec ou sans préfixe Bearer (Postman)
      const cookieToken = readCookie(
        socket.handshake.headers.cookie,
        AUTH_COOKIE_NAME,
      );

      const authHeader = socket.handshake.headers.authorization;
      const headerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

      const token =
        cookieToken ??
        (socket.handshake.auth?.token as string | undefined) ??
        headerToken;

      if (!token) {
        return next();
      }

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as AccessTokenPayload;

      const user = await User.findById(payload.id).select("-password");
      if (!user) {
        return next(new Error("Utilisateur introuvable"));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Authentification socket invalide"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connecté:", socket.id);

    socket.on("join_dashboard", () => {
      const user = socket.data.user;
      if (!user) return; // pas de JWT valide -> pas d'accès aux dashboards

      if (user.role === "admin") {
        socket.join(STORES.map((store) => `dashboard:${store}`));
      } else if (user.store) {
        socket.join(`dashboard:${user.store}`);
      }

      console.log(`${socket.id} a rejoint le(s) dashboard(s) (${user.role})`);
    });

    socket.on("join_order_tracking", (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`${socket.id} suit la commande order:${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client déconnecté:", socket.id);
    });
  });

  return io;
}
