import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { STORES } from "./stores.js";

export let io: Server;

interface AccessTokenPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // Authentifie la connexion socket via le JWT (envoyé dans socket.handshake.auth.token).
  // Une connexion sans token reste autorisée (client public qui suit sa commande),
  // mais n'aura simplement pas accès aux rooms "dashboard:*".
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
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
