<div align="center">

# 🍔 Niwa Food — Frontend

**Site vitrine, commande en ligne, dashboard de gestion et espace livreur** pour un fast-food artisanal à Alger (Kouba & Chéraga).

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)](https://socket.io)

[🌐 Démo en ligne](https://niwa-food.vercel.app) · [⚙️ Backend](https://github.com/mehdiabdi7)

</div>

---

## Sommaire

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Architecture](#architecture)
- [Contrat d'API](#contrat-dapi)
- [Temps réel](#temps-réel)
- [Choix techniques notables](#choix-techniques-notables)
- [Structure du projet](#structure-du-projet)
- [Déploiement](#déploiement)
- [Points d'attention](#points-dattention)

---

## Présentation

**Niwa Food** est une application full-stack de commande et de gestion pour un fast-food multi-établissements. Ce dépôt contient **l'intégralité du frontend** : un seul projet Next.js sert quatre espaces distincts, séparés par des _route groups_ et protégés par rôle.

| Espace             | Route                                                                                         | Public     | Rôle requis          |
| ------------------ | --------------------------------------------------------------------------------------------- | ---------- | -------------------- |
| 🏠 Vitrine & carte | `/`, `/commande`, `/a-propos`, `/contact`                                                     | ✅ Ouvert  | —                    |
| 🔐 Connexion       | `/login`                                                                                      | ✅ Ouvert  | —                    |
| 📊 Dashboard       | `/dashboard`, `/commandes`, `/tables`, `/menu`, `/historique`, `/utilisateurs`, `/parametres` | ❌ Protégé | `admin` / `employee` |
| 🛵 Espace livreur  | `/livraison`                                                                                  | ❌ Protégé | `delivery`           |

Ces quatre espaces sont le miroir exact du cloisonnement de l'API : le front masque les pages, **le backend protège les données**. Un livreur qui atteindrait `/dashboard` recevrait des 403 sur chaque appel.

---

## Fonctionnalités

### 🌐 Site public

- **Vitrine animée** — hero avec carrousel Redux, best-sellers en défilement infini, témoignages, décodeur du menu (chaque plat porte le nom d'une référence moto), reveal au scroll respectant `prefers-reduced-motion`.
- **Carte complète** — affichage intégral, sans filtrage destructif : navigation par scroll-spy, sections et sous-sections, recherche par nom **ou par ingrédient**.
- **Fiche produit** — variantes, formules (Menu / Menu Kids), groupes d'extras configurables, retrait d'ingrédients, prix recalculé en direct.
- **Panier persistant** — `localStorage` versionné, TTL 24 h, **réconcilié contre le menu réel** à chaque montage avec notification des articles retirés.
- **Tunnel de commande** — sur place / à emporter / livraison, sélection de table, blocage préventif si le magasin a coupé les commandes en ligne.
- **Suivi temps réel** — room Socket.io par commande, fallback polling, plus une recherche par numéro + magasin pour qui a fermé son onglet.

### 📊 Dashboard staff

- **Kanban commandes** — _Nouvelles / Prêtes / En livraison_, minuteur coloré par ancienneté, alerte sonore, transitions en un clic.
- **Prise de commande** — parcours menu complet, ticket sticky (desktop) ou drawer (mobile).
- **Tables** — occupation par magasin, libération manuelle, CRUD admin.
- **Menu** — CRUD produits, variantes, groupes d'extras (`ExtraGroupsEditor`), upload Cloudinary.
- **Historique** — calendrier-filtre en colonne collante, agrégations année/mois/jour, recherche debouncée, tri, pagination serveur, export CSV.
- **Équipe** — comptes et rôles, protégé par un layout serveur admin-only.
- **Paramètres** — profil, ouverture de service, interrupteur des commandes en ligne, thème.

### 🛵 Espace livreur

Écran unique, pensé pour un téléphone tenu d'une main : adresse et téléphone en boutons pleine largeur (≥ 56 px), lien Google Maps, détail du sac repliable, total à encaisser, validation avec confirmation. Mise à jour live via la room `delivery:<id>`.

---

## Stack technique

| Domaine        | Choix                                                  |
| -------------- | ------------------------------------------------------ |
| **Framework**  | Next.js 16 (App Router, Server Components, ISR)        |
| **UI**         | React 19, TypeScript strict                            |
| **Styles**     | Tailwind CSS v4 (`@theme inline`, design tokens CSS)   |
| **State**      | Redux Toolkit + RTK Query                              |
| **Temps réel** | socket.io-client (middleware Redux)                    |
| **Icônes**     | Iconify (`@iconify/tailwind4`, sets `mdi` + `line-md`) |
| **Polices**    | Fontsource (Baloo 2 + DM Sans, auto-hébergées)         |
| **Images**     | `next/image` + Cloudinary (`remotePatterns`)           |

---

## Démarrage rapide

### Prérequis

- Node.js ≥ 20
- Le [backend Niwa Food](https://github.com/mehdiabdi7) lancé (par défaut sur `http://localhost:5000`)

### Installation

```bash
git clone https://github.com/mehdiabdi7/fastfood-frontend.git
cd fastfood-frontend

npm install

cp .env.example .env.local
# renseigner NEXT_PUBLIC_API_URL

npm run dev
```

Application disponible sur **http://localhost:3000**.

> ⚠️ Côté backend, `CORS_ORIGIN` doit inclure `http://localhost:3000`.

### Scripts

```bash
npm run dev     # serveur de développement (Turbopack)
npm run build   # build de production
npm run start   # serveur de production
npm run lint    # ESLint
```

---

## Variables d'environnement

| Variable                 | Requis | Description                                            |
| ------------------------ | :----: | ------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`    |   ✅   | URL publique du backend, **sans slash final**          |
| `NEXT_PUBLIC_SOCKET_URL` |   ⬜   | URL Socket.io ; reprend `NEXT_PUBLIC_API_URL` si omise |

```env
NEXT_PUBLIC_API_URL=https://votre-backend.example.com
NEXT_PUBLIC_SOCKET_URL=https://votre-backend.example.com
```

> ⚠️ Le build de production **échoue volontairement** si `NEXT_PUBLIC_API_URL` est absente, plutôt que de déployer une application qui appellerait `localhost`.

---

## Architecture

### Flux d'authentification

```
Navigateur ──► proxy.ts (Edge)          présence du cookie uniquement
                    │                    (pas de vérification JWT : runtime Edge)
                    ▼
           layout (dashboard|livraison)  getSession() → GET /auth
                    │                    redirection si session invalide
                    ▼
              SessionSync                pousse le user dans Redux
                    │
                    ▼
            socketMiddleware             ouvre le socket, rejoint la bonne room
```

Le token vit dans un **cookie `httpOnly`** (`niwa_token`) que le JavaScript ne lit jamais. Trois barrières successives :

1. **`src/proxy.ts`** — filtre Edge, simple optimisation : il évite de rendre une page pour rien, il ne sécurise rien.
2. **Layouts serveur** — `getSession()` mémoïsé par `cache()`, redirection avant le moindre pixel, aiguillage par rôle.
3. **Backend** — seule autorité réelle, revalide chaque appel (`CheckAuth`, `isStaff`, `isAdmin`).

### Contournement du cookie cross-domain

Front (Vercel) et API (Render) sont sur des domaines différents : le `Set-Cookie` du backend appartiendrait à `onrender.com`, illisible depuis `vercel.app`. Solution — un **rewrite Next** :

```ts
// next.config.ts
async rewrites() {
  return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
}
```

RTK Query utilise donc `baseUrl: "/api"`. Le cookie devient _first-party_, `proxy.ts` et `getSession()` peuvent le lire, et tout devient same-origin (plus de préflight CORS).

Deux exceptions qui attaquent l'API **directement**, et qui expliquent que `CORS_ORIGIN` reste nécessaire côté backend :

- `serverFetch.ts` / `publicFetch.ts` — appels serveur, avec réémission manuelle du cookie
- le **handshake Socket.io**

### Gestion d'état

```
Redux Toolkit
├── RTK Query (src/server/api.ts)   ─ toutes les données serveur, invalidation par tags
├── auth                            ─ session résolue côté serveur
├── publicCart                      ─ panier client (+ listener de persistance)
├── menuBrowse                      ─ recherche & section active du scroll-spy
├── storeScope                      ─ magasin actif (admin)
├── theme / navbar / heroCarousel   ─ UI
└── toast                           ─ notifications
```

---

## Contrat d'API

Toutes les réponses du backend sont enveloppées. Les endpoints RTK Query déballent via `transformResponse` :

```ts
// src/types/api.ts
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  token?: string;
}
interface ApiErrorBody {
  error: string;
  field?: string;
}
```

```ts
transformResponse: (response: ApiEnvelope<Order>) => response.data;
```

> Oublier ce `transformResponse` est l'erreur classique : `created.dailyNumber` vaut alors `undefined` et le toast affiche « Commande #undefined créée ».

`getApiErrorMessage()` (`src/lib/apiError.ts`) lit `error.data.error` avec un repli — le backend y met déjà des messages destinés à l'utilisateur final : le délai exact d'un 429, le message de fermeture d'un magasin sur un 503, la raison d'une transition refusée.

### Codes que le front traite explicitement

| Code    | Situation                                            | Réponse de l'interface             |
| ------- | ---------------------------------------------------- | ---------------------------------- |
| **401** | Session expirée                                      | Redirection `/login`               |
| **403** | Autre magasin, rôle insuffisant                      | Message d'erreur                   |
| **409** | Service ouvert avec commandes actives, table occupée | Message contextuel                 |
| **429** | Rate limit                                           | Délai exact affiché                |
| **503** | Magasin fermé aux commandes                          | Bandeau + bouton d'envoi désactivé |

### Données publiques rendues côté serveur

La carte et le tunnel utilisent `publicFetch` avec `revalidate: 60` : le HTML du menu arrive **avant** le JavaScript, ce qui compte quand le client scanne un QR code en 4G.

L'état d'ouverture des magasins, lui, est volontairement **exclu** de ce rendu ISR et chargé côté client : figé une minute dans le HTML, il pourrait annoncer « ouvert » après la fermeture.

---

## Temps réel

`socketMiddleware` ouvre une connexion unique à `sessionLoaded`, la ferme à `sessionCleared`, et rejoint la room correspondant au rôle.

| Événement reçu                    | Tags RTK Query invalidés                          |
| --------------------------------- | ------------------------------------------------- |
| `new_order`                       | `Order`, `ServiceStats`, `Counter`                |
| `order_updated` · `order_deleted` | `Order`, `ServiceStats`, `Table`                  |
| `counter_reset`                   | `Order`, `ServiceStats`, `Counter`, `StoreStatus` |
| `store_status_changed`            | `StoreStatus`                                     |
| `delivery_updated`                | `Order/MY_DELIVERIES`                             |

**Le socket ne transporte jamais de données applicatives** : il invalide des tags, RTK Query refetche. Une seule source de vérité, quel que soit le canal — et aucun contrôle d'autorisation à réimplémenter côté client.

Le suivi client (`useOrderTracking`) ouvre son **propre** socket : son cycle de vie est celui d'une page et d'une commande, pas celui d'une session. Il affiche honnêtement son état (« Suivi en direct » vs « Actualisation automatique ») et adapte son polling de secours (60 s connecté, 12 s sinon).

> `counter_reset` invalide aussi `StoreStatus` : côté backend, ouvrir un service **rouvre les commandes en ligne**. Sans cette invalidation, l'autre poste garderait l'interrupteur en position fermée.

---

## Choix techniques notables

<details>
<summary><b>🍪 Cookie httpOnly plutôt que localStorage</b></summary>

Le token n'est jamais accessible au JavaScript, ce qui neutralise l'exfiltration par XSS. Corollaire : la session est résolue côté serveur (`getSession`), il n'y a plus d'écran de chargement au montage du dashboard — et la déconnexion doit passer par `POST /auth/logout`, seul le serveur pouvant effacer le cookie.

</details>

<details>
<summary><b>📅 Historique : calendrier-filtre, pas drill-down</b></summary>

Le calendrier reste affiché en permanence et resserre la liste au clic, au lieu de changer d'écran. Comparer deux jours prend deux clics. En `xl`, il passe en colonne collante à droite (`flex-row-reverse` pour rester premier dans le DOM, donc au-dessus sur mobile).

Toute la charge — plage de dates, recherche, tri, pagination, totaux — est portée par MongoDB. Le navigateur ne reçoit jamais plus de 20 lignes projetées.

L'axe temporel est `serviceDate`, jamais `completedAt` : une commande encaissée à 00h20 appartient au service de la veille. Elle s'affiche donc avec `formatServiceDate()` (`timeZone: "UTC"`), et non `formatDateTime()`.

</details>

<details>
<summary><b>🎠 Carrousel infini sans scroll-snap</b></summary>

La liste est rendue trois fois, le hook maintient le scroll dans la copie centrale. **Ni `scroll-snap` ni `scroll-behavior: smooth` en CSS** : le setter `scrollLeft` respecte `scroll-behavior`, ce qui fige totalement la dérive sur Safari iOS. La fluidité est demandée explicitement dans `scrollByCard`.

</details>

<details>
<summary><b>🔒 Verrou de défilement (<code>scrollLock.ts</code>)</b></summary>

`body.style.overflow = "hidden"` est inopérant ici : le `<html>` porte `overflow-x-clip` (nécessaire au sticky de la sidebar), ce qui coupe la propagation vers le viewport. Le verrou utilise `position: fixed` + restauration de `scrollY`, avec un compteur pour gérer l'imbrication (ticket → fiche produit).

</details>

<details>
<summary><b>🧩 Groupes d'extras portés par le produit</b></summary>

Le libellé et la règle de choix unique appartiennent au **produit**, pas à l'ingrédient : un même « Gouda » est « Gratinage » (choix unique) sur un tacos et « Suppléments » (cumulable) sur une pizza.

`lib/extraGroups.ts` conserve un repli sur l'ancien modèle `availableExtras` — exactement comme `buildExtraContext` côté serveur — le temps de la migration.

Les prix calculés ici sont **purement indicatifs** : le backend recalcule tout à la création via `resolveOrderItemsPricing`. Aucun montant envoyé par le client n'est accepté.

</details>

<details>
<summary><b>🎨 Design tokens</b></summary>

Palette chaude dérivée du logo (terre cuite, moutarde, bordeaux, vert), déclarée en variables CSS dans `globals.css` et exposée à Tailwind via `@theme inline`. Thème clair/sombre géré par un script anti-FOUC inline dans le `<head>`, donc appliqué dès le premier paint. Vocabulaire couleur des statuts unifié (`--color-status-*`).

</details>

<details>
<summary><b>📤 Export CSV et injection de formules</b></summary>

Une cellule commençant par `=`, `+`, `-` ou `@` est interprétée comme une **formule** par Excel et LibreOffice. Un client nommé `-Ali` suffit à casser le fichier ; une saisie malveillante l'utilise pour exécuter du code chez la personne qui l'ouvre. `exportCsv.ts` préfixe donc ces valeurs d'une apostrophe, double les guillemets et ajoute un BOM UTF-8 (sans quoi Excel affiche « ChÃ©raga »).

L'export porte sur la **page affichée**, volontairement : exporter une année entière demanderait de rapatrier des dizaines de milliers de lignes, exactement ce que la pagination serveur cherche à éviter.

</details>

---

## Structure du projet

```
src/
├── app/
│   ├── (auth)/login/              # Suspense pour useSearchParams
│   ├── (dashboard)/               # layout serveur + garde de rôle
│   │   ├── commandes/             # kanban, prise de commande, ajout d'articles
│   │   ├── dashboard/             # stats du service en cours
│   │   ├── historique/            # calendrier + liste paginée
│   │   ├── menu/ tables/
│   │   ├── utilisateurs/          # layout imbriqué admin-only
│   │   └── parametres/
│   ├── (livraison)/               # espace livreur, coquille minimale
│   ├── (public)/                  # vitrine, carte, tunnel, suivi
│   ├── globals.css                # design tokens + keyframes
│   ├── layout.tsx                 # polices, script anti-FOUC
│   └── providers.tsx
│
├── components/
│   ├── dashboard/  delivery/  history/  menu/  orders/
│   ├── public/     publicOrder/  settings/  tables/  users/
│   └── ui/                        # Button, Input, Modal, Switch…
│
├── features/                      # slice + API + hook, par domaine
│   ├── auth/  orders/  menu/  tables/  history/
│   ├── publicOrder/               # cartSlice, browseSlice, scroll-spy
│   ├── delivery/  storeSettings/  store/  theme/  toast/
│   └── carousel/  navbar/  reveal/  heroCarousel/  testimonials/
│
├── lib/                           # logique pure & utilitaires
│   ├── cartLine.ts                # clé de fusion, prix, payload (partagé)
│   ├── cartStorage.ts  lastOrder.ts  scrollLock.ts
│   ├── calendar.ts  format.ts  exportCsv.ts  printTicket.ts
│   ├── extraGroups.ts  formulaRules.ts  orderTransitions.ts
│   ├── serverFetch.ts  publicFetch.ts  session.ts
│   └── store.ts  hooks.ts
│
├── config/                        # formulas.ts, locations.ts
├── middlewares/socketMiddleware.ts
├── server/api.ts                  # createApi + tagTypes
├── types/                         # miroirs des modèles backend
└── proxy.ts                       # ex-middleware.ts (convention Next 16)
```

---

## Déploiement

| Composant       | Plateforme                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | **Vercel** — [niwa-food.vercel.app](https://niwa-food.vercel.app) |
| Backend         | **Render**                                                        |
| Base de données | **MongoDB Atlas**                                                 |
| Images          | **Cloudinary**                                                    |

Sur Vercel, ajouter `NEXT_PUBLIC_API_URL` pour **Production**, **Preview** et **Development**.

Côté backend, veiller à :

- `CORS_ORIGIN` — inclure le domaine Vercel (le handshake socket en dépend)
- `ALLOW_VERCEL_PREVIEWS=true` — si les déploiements de preview doivent fonctionner (URLs à hash, impossibles à lister)
- `NODE_ENV=production` — active `sameSite=none` + `secure` sur le cookie

---

## Points d'attention

> Fichiers dupliqués côté backend, à garder synchronisés manuellement :

| Frontend                                      | Backend                    | Conséquence d'une divergence                   |
| --------------------------------------------- | -------------------------- | ---------------------------------------------- |
| `src/config/formulas.ts`                      | `src/config/formulas.ts`   | Options affichées que l'API rejette en **400** |
| `src/types/store.ts`                          | `src/config/stores.ts`     | Magasin absent d'un sélecteur                  |
| `src/types/order.ts` (`ORDER_TYPES`)          | `src/config/orderTypes.ts` | Onglet de filtre manquant                      |
| `src/lib/orderTransitions.ts`                 | `ALLOWED_TRANSITIONS`      | Bouton proposé qui échoue systématiquement     |
| `src/features/storeSettings/closedMessage.ts` | `DEFAULT_CLOSED_MESSAGE`   | Deux formulations pour la même situation       |

> Le backend fait toujours foi : ces miroirs servent l'affichage, jamais la décision.

---

<div align="center">

**Développé par [Mehdi Abdi](https://github.com/mehdiabdi7)** — Projet final GoMyCode, Full Stack Web Developer

</div>
