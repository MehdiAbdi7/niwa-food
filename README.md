<div align="center">

# 🍔 Niwa Food

**Plateforme de commande multi-magasins** pour un fast-food à Alger (Kouba et Chéraga) : site vitrine, commande en ligne (QR code à table, à emporter, livraison), suivi des commandes en temps réel et back-office du personnel.

[🌐 Démo en ligne](https://niwa-food.vercel.app) · [Frontend](./client) · [Backend](./server)

</div>

---

## Structure du dépôt

| Dossier             | Rôle                          | Stack                                                                                   | Hébergement |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| [`client/`](client) | Site public et back-office    | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Redux Toolkit, RTK Query | Vercel      |
| [`server/`](server) | API REST et temps réel        | Node.js, Express 5, TypeScript, MongoDB Atlas (Mongoose), Zod, Socket.io, JWT, Cloudinary | Render      |

Chaque dossier a son propre README détaillé : [client/README.md](client/README.md) et [server/README.md](server/README.md).

## Démarrage rapide

```bash
git clone https://github.com/mehdiabdi7/niwa-food.git
cd niwa-food

# 1. L'API (http://localhost:5000)
cd server
npm install
cp .env.example .env   # renseigner MongoDB, JWT_SECRET, Cloudinary…
npm run dev

# 2. Le front (http://localhost:3000), dans un second terminal
cd client
npm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_API_URL
npm run dev
```

## Déploiement

Les deux applications se déploient séparément depuis ce dépôt :

- **Vercel** (front) : Root Directory `client`
- **Render** (API) : Root Directory `server`

---

<div align="center">

**Développé par [Mehdi Abdi](https://github.com/mehdiabdi7)** · Projet de fin de formation GoMyCode, Full Stack Web Developer

</div>
