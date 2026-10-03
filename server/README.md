<div align="center">

# 🍔 Niwa Food — Backend

**API REST + temps réel** pour un fast-food multi-établissements à Alger (Kouba & Chéraga) : commandes, service, menu, tables, historique et espace livreur.

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Zod](https://img.shields.io/badge/Zod-4-3E67B1)](https://zod.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)](https://socket.io)

[⚙️ Frontend](https://github.com/mehdiabdi7) · [🌐 Application en ligne](https://niwa-food.vercel.app)

</div>

---

## Sommaire

- [Présentation](#présentation)
- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Modèle de domaine](#modèle-de-domaine)
- [Authentification & rôles](#authentification--rôles)
- [Référence API](#référence-api)
- [Temps réel (Socket.io)](#temps-réel-socketio)
- [Concepts métier](#concepts-métier)
- [Sécurité](#sécurité)
- [Performance](#performance)
- [Scripts de maintenance](#scripts-de-maintenance)
- [Structure du projet](#structure-du-projet)
- [Déploiement](#déploiement)
- [Points d'attention](#points-dattention)

---

## Présentation

API du système **Niwa Food**. Elle sert quatre publics aux droits radicalement différents, à travers une seule base de code :

| Public                | Accès                                             | Protection                                             |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| 🌐 **Client anonyme** | carte, création de commande, suivi                | aucune auth — projections restrictives + rate limiting |
| 👤 **Employé**        | service de **son** magasin                        | `CheckAuth` + `isStaff` + scope magasin                |
| 🛡️ **Admin**          | tout, les deux magasins                           | `CheckAuth` + `isAdmin`                                |
| 🛵 **Livreur**        | **uniquement** les courses qui lui sont assignées | `CheckAuth` + filtre `deliveryPerson: req.user._id`    |

Le rôle `delivery` est un **prestataire externe**, pas un membre du restaurant : il est exclu de toute route portant `isStaff`, et sa room Socket.io est dérivée du JWT, jamais d'un paramètre client.

---

## Stack technique

| Domaine             | Choix                                                 |
| ------------------- | ----------------------------------------------------- |
| **Runtime**         | Node.js 22+, ESM natif (`"type": "module"`)           |
| **Framework**       | Express 5                                             |
| **Langage**         | TypeScript strict, `module: nodenext`                 |
| **Base de données** | MongoDB Atlas + Mongoose 9                            |
| **Validation**      | Zod 4 (middlewares génériques body/query)             |
| **Auth**            | JWT (cookie `httpOnly`) + bcrypt                      |
| **Temps réel**      | Socket.io 4, rooms par magasin / livreur / commande   |
| **Images**          | Cloudinary + Multer (stockage mémoire, stream direct) |
| **Sécurité**        | Helmet, CORS liste blanche, express-rate-limit        |
| **Divers**          | morgan, http-status-codes, qrcode, tsx                |

---

## Démarrage rapide

### Prérequis

- **Node.js ≥ 22**
- Un cluster **MongoDB Atlas**
- Un compte **Cloudinary** (images produits)

### Installation

```bash
git clone https://github.com/mehdiabdi7/fastfood-backend.git
cd fastfood-backend

npm install

cp .env.example .env
# renseigner MongoDB, JWT_SECRET, Cloudinary…

# créer le premier administrateur
npx tsx src/scripts/createAdmin.ts

npm run dev
```

API disponible sur **http://localhost:5000** — vérification : `GET /health` → `{ "status": "ok" }`.

### Scripts

```bash
npm run dev     # tsx watch, rechargement à chaud
npm run build   # compilation TypeScript vers dist/
npm run start   # node dist/index.js (production)
```

> 💡 **Réseau local** — `config/db.ts` force les résolveurs DNS `8.8.8.8` / `1.1.1.1` **hors production** : certains FAI répondent mal aux enregistrements SRV de `mongodb+srv`, ce qui fait échouer la connexion Atlas. Inutile sur Render, où le DNS du conteneur fonctionne.

---

## Variables d'environnement

### Base de données

| Variable           | Requis | Description                                       |
| ------------------ | :----: | ------------------------------------------------- |
| `MONGODB_USERNAME` |   ✅   | Utilisateur Atlas                                 |
| `MONGODB_PASSWORD` |   ✅   | Mot de passe (encodé automatiquement)             |
| `MONGODB_HOST`     |   ✅   | Hôte du cluster, ex. `cluster0.xxxxx.mongodb.net` |
| `MONGODB_DB_NAME`  |   ✅   | Nom de la base                                    |
| `MONGODB_APP_NAME` |   ✅   | `appName` de la chaîne de connexion               |

### Authentification

| Variable         | Requis | Défaut | Description                                                              |
| ---------------- | :----: | ------ | ------------------------------------------------------------------------ |
| `JWT_SECRET`     |   ✅   | —      | Clé de signature (chaîne aléatoire longue)                               |
| `JWT_EXPIRES_IN` |   ⬜   | `7d`   | Durée du token — **pilote aussi le `maxAge` du cookie**                  |
| `COOKIE_DOMAIN`  |   ⬜   | —      | Uniquement si front et API partagent un domaine parent (`.niwafood.com`) |

### Réseau

| Variable                | Requis | Défaut                  | Description                                                |
| ----------------------- | :----: | ----------------------- | ---------------------------------------------------------- |
| `PORT`                  |   ⬜   | `5000`                  | Port d'écoute                                              |
| `NODE_ENV`              |   ⬜   | `development`           | `production` active `secure`/`sameSite=none` sur le cookie |
| `CORS_ORIGIN`           |   ⬜   | `http://localhost:3000` | Origines autorisées, **séparées par des virgules**         |
| `ALLOW_VERCEL_PREVIEWS` |   ⬜   | `false`                 | Autorise `https://*.vercel.app` (URLs de preview)          |
| `FRONTEND_URL`          |   ⬜   | —                       | Utilisé par le script de génération du QR code             |

### Cloudinary

| Variable                | Requis |
| ----------------------- | :----: |
| `CLOUDINARY_CLOUD_NAME` |   ✅   |
| `CLOUDINARY_API_KEY`    |   ✅   |
| `CLOUDINARY_API_SECRET` |   ✅   |

### Seed du premier admin

`SEED_ADMIN_FIRSTNAME`, `SEED_ADMIN_LASTNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_TEL`, `SEED_ADMIN_PASSWORD` — lues uniquement par `scripts/createAdmin.ts`.

---

## Modèle de domaine

```
User ──────────────┐
 role: admin | employee | delivery
 store: kouba | cheraga        (requis sauf admin)
                   │
                   │ deliveryPerson
                   ▼
MenuCategory ──► MenuItem ──► Order ◄────── Table
                    │           │            status: free | occupied
                    │           │            currentOrderId
              extraGroups   items[] (snapshot figé)
                    │           │  name, unitPrice, selectedExtras[], formula
                    ▼           │
              MenuExtra         ├─ store, dailyNumber, serviceDate
                    │           └─ status, totalPrice, completedAt
                    ▼
              MenuExtraType

Counter          — numérotation + heure d'ouverture, par magasin
StoreSettings    — ouverture/fermeture des commandes en ligne, par magasin
```

**Les items d'une commande sont un instantané**, jamais des références vivantes : nom, prix unitaire, extras et formule sont recopiés à la création. Changer le prix d'un burger demain ne réécrit pas le chiffre d'affaires d'hier.

---

## Authentification & rôles

### Le cookie plutôt que le header

Le JWT est posé dans un cookie **`httpOnly`** nommé `niwa_token` : inaccessible à `document.cookie`, donc hors de portée d'une XSS. Le header `Authorization` reste accepté (Postman, scripts, tests), mais le cookie a la priorité.

```ts
// middlewares/auth.ts
req.cookies?.[AUTH_COOKIE_NAME] ??
  extractTokenFromHeader(req.headers.authorization);
```

La durée du cookie est **dérivée de `JWT_EXPIRES_IN`** : sans ça, un cookie encore valide porterait un JWT expiré, et l'utilisateur paraîtrait connecté avant de se prendre un 401 incompréhensible.

Corollaire : le client ne peut plus effacer le token lui-même — la déconnexion **doit** passer par `POST /auth/logout`.

### Les quatre middlewares

| Middleware     | Rôle                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| `CheckAuth`    | exige une session valide, charge `req.user`                                          |
| `optionalAuth` | identifie **si possible**, ne bloque jamais — pour les routes partagées public/staff |
| `isStaff`      | liste blanche `["admin", "employee"]` — barrière entre le restaurant et l'extérieur  |
| `isAdmin`      | administration (comptes, menu, suppression de commandes)                             |

> ⚠️ **`optionalAuth` ne protège rien.** Il sert uniquement à _savoir_ qui appelle. Sur `POST /orders`, c'est lui qui permet au staff de prendre une commande au comptoir alors que les commandes en ligne sont coupées.

> ⚠️ **`isStaff` est une liste blanche, pas `role !== "delivery"`.** Un nouveau rôle sera refusé par défaut, et non autorisé en silence.

### Garde-fous sur les comptes

- Impossible de **supprimer son propre compte**
- Impossible de **supprimer ou rétrograder le dernier admin** (la condition porte sur « cesse d'être admin », donc passer le dernier admin en livreur est aussi bloqué)
- `PATCH /auth/me` (self-service) **n'accepte ni `role` ni `store`** — sans quoi un employé s'auto-promouvrait admin en « modifiant son profil »

---

## Référence API

Toutes les réponses suivent la même enveloppe :

```jsonc
// succès
{ "success": true, "message": "...", "data": { } }

// succès paginé
{ "success": true, "message": "...", "data": [], "totalCount": 0, "totalPages": 1, "currentPage": 1 }

// erreur
{ "error": "Message lisible", "field": "email" }
```

### Auth — `/auth`

| Méthode  | Route               | Accès  | Description                                        |
| -------- | ------------------- | ------ | -------------------------------------------------- |
| `GET`    | `/`                 | auth   | Session courante                                   |
| `POST`   | `/login`            | public | Connexion (5 tentatives / 15 min)                  |
| `POST`   | `/logout`           | public | Efface le cookie (volontairement sans `CheckAuth`) |
| `PATCH`  | `/me`               | auth   | Profil personnel — contact uniquement              |
| `GET`    | `/delivery-persons` | staff  | Livreurs assignables (projection minimale)         |
| `POST`   | `/register`         | admin  | Création de compte                                 |
| `GET`    | `/users`            | admin  | Liste, filtres `?store=`, `?role=`                 |
| `PATCH`  | `/users/:id`        | admin  | Modification                                       |
| `DELETE` | `/users/:id`        | admin  | Suppression                                        |

### Menu — `/menu-categories`, `/menu-extra-types`, `/menu-extras`, `/menu-items`

| Méthode                               | Accès      | Description                                                      |
| ------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `GET /`                               | **public** | Lecture — la carte publique et la prise de commande en dépendent |
| `POST /` · `PUT /:id` · `DELETE /:id` | admin      | Écritures                                                        |

`GET /menu-items` peuple `category`, `availableExtras` et `extraGroups.options.extra`.

### Tables — `/tables`

| Méthode  | Route            | Accès      | Description                                      |
| -------- | ---------------- | ---------- | ------------------------------------------------ |
| `GET`    | `/`              | staff      | Détail complet, scopé par magasin                |
| `GET`    | `/public?store=` | **public** | `tableN` + `status` seulement                    |
| `POST`   | `/`              | admin      | Création (unicité `tableN` + `store`)            |
| `PUT`    | `/:id`           | admin      | Modification                                     |
| `PATCH`  | `/:id/free`      | staff      | Libération manuelle — **409** si commande active |
| `DELETE` | `/:id`           | admin      | Refusé sur une table occupée                     |

### Commandes — `/orders`

**Public**

| Méthode | Route                         | Description                                      |
| ------- | ----------------------------- | ------------------------------------------------ |
| `POST`  | `/`                           | Création (100 / 15 min) — `optionalAuth`         |
| `GET`   | `/lookup?store=&dailyNumber=` | Retrouve une commande **en cours** (40 / 15 min) |
| `GET`   | `/:id/track`                  | Suivi — projection `TRACKING_FIELDS`             |

**Staff**

| Méthode | Route                                  | Description                                                                     |
| ------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `GET`   | `/`                                    | Liste — `?scope=active\|service\|all`, `?status=`, `?type=`, `?store=`, paginée |
| `GET`   | `/:id`                                 | Détail                                                                          |
| `PATCH` | `/:id/items`                           | Ajout d'articles                                                                |
| `PATCH` | `/:id/status`                          | Transition + assignation de livreur optionnelle                                 |
| `PATCH` | `/:id/delivery-fee`                    | Frais de livraison                                                              |
| `PATCH` | `/:id/delivery-person`                 | Correction d'assignation, hors changement de statut                             |
| `GET`   | `/counter` · `POST /counter/reset`     | Service : état / ouverture                                                      |
| `GET`   | `/stats/service`                       | Stats du service en cours (`$facet`)                                            |
| `GET`   | `/history`                             | Liste paginée, tri, recherche                                                   |
| `GET`   | `/history/years` · `/months` · `/days` | Agrégations du calendrier                                                       |

**Livreur**

| Méthode | Route            | Description                                      |
| ------- | ---------------- | ------------------------------------------------ |
| `GET`   | `/my-deliveries` | Ses courses `out_for_delivery`                   |
| `PATCH` | `/:id/delivered` | Confirmation de remise — contrôle d'appartenance |

**Admin**

| Méthode  | Route  | Description                                                        |
| -------- | ------ | ------------------------------------------------------------------ |
| `DELETE` | `/:id` | Suppression physique — statuts `pending`, `cancelled`, `completed` |

### Magasins — `/stores`

| Méthode | Route     | Accès      | Description                              |
| ------- | --------- | ---------- | ---------------------------------------- |
| `GET`   | `/status` | **public** | État d'ouverture des commandes en ligne  |
| `PATCH` | `/status` | staff      | Ouvre / ferme, avec message personnalisé |

### Upload — `/upload`

| Méthode  | Route                  | Accès                           |
| -------- | ---------------------- | ------------------------------- |
| `POST`   | `/menu-item-image/:id` | admin — jpeg/png/webp, 5 Mo max |
| `DELETE` | `/menu-item-image/:id` | admin                           |

---

## Temps réel (Socket.io)

### Trois familles de rooms

| Room                | Rejointe par                            | Contenu diffusé  |
| ------------------- | --------------------------------------- | ---------------- |
| `dashboard:<store>` | `join_dashboard` — **staff uniquement** | Document complet |
| `delivery:<userId>` | `join_delivery` — **id dérivé du JWT**  | Signal seul      |
| `order:<orderId>`   | `join_order_tracking` — public          | Signal seul      |

### Événements

| Événement                                                                                          | Room      | Déclencheur                         |
| -------------------------------------------------------------------------------------------------- | --------- | ----------------------------------- |
| `new_order`                                                                                        | dashboard | Création                            |
| `order_updated`                                                                                    | dashboard | Statut, articles, frais, livreur    |
| `order_deleted`                                                                                    | dashboard | Suppression admin                   |
| `counter_reset`                                                                                    | dashboard | Ouverture de service                |
| `store_status_changed`                                                                             | dashboard | Ouverture/fermeture des commandes   |
| `delivery_updated`                                                                                 | delivery  | Assignation, réassignation, clôture |
| `order_ready` · `order_out_for_delivery` · `order_completed` · `order_cancelled` · `order_updated` | order     | Suivi client                        |

### Signal plutôt que payload

Les rooms `order:*` et `delivery:*` **ne reçoivent que `{ _id }`**, jamais le document.

> La room de suivi est rejoignable par quiconque connaît l'`_id`, et le document contient le téléphone et l'adresse du client. Le front refetche `GET /orders/:id/track`, qui applique déjà la bonne projection — une seule source de vérité, et **aucun contrôle d'autorisation à réimplémenter côté socket**.

Même logique pour le livreur : le refetch de `/my-deliveries` réapplique le filtre `deliveryPerson: moi`.

### Authentification du handshake

Le handshake court-circuite la pile Express, donc `cookie-parser` ne s'exécute pas : `config/socket.ts` **lit l'en-tête `Cookie` brut**. Une connexion sans token reste acceptée (client public), mais n'accède à aucune room `dashboard:*`.

---

## Concepts métier

<details>
<summary><b>🌙 <code>serviceDate</code> — la journée commerciale</b></summary>

Le service ferme à 00h30. Une commande encaissée à 00h20 appartient au service **de la veille**, alors que son `completedAt` porte la date du lendemain. Trier l'historique sur `completedAt` faisait basculer les meilleures ventes de la soirée sur la mauvaise case du calendrier.

**Règle** — c'est l'**ouverture du service** qui date toutes ses commandes, quelle que soit l'heure d'encaissement.

`serviceDate` est estampillée **une fois** à la création (`issueOrderNumber`), jamais recalculée : c'est ce qui la rend indexable. La recalculer imposerait une jointure sur les compteurs à chaque requête.

Stockage à **minuit UTC** : `$year` / `$month` / `$dayOfMonth` renvoient alors le jour local exact, sans option `timezone`.

</details>

<details>
<summary><b>🔢 Numérotation par service, pas par date</b></summary>

`dailyNumber` repart à 1 quand le staff **ouvre un nouveau service**, jamais automatiquement à minuit — le service déborde sur le lendemain.

`issueOrderNumber` fait un `findOneAndUpdate` atomique qui renvoie **à la fois** le numéro et l'heure d'ouverture : deux lectures séparées laisseraient une fenêtre où un autre poste ouvre un service entre les deux, ce qui daterait la commande du mauvais service.

L'ouverture est **refusée en 409** s'il reste des commandes actives (deux commandes porteraient le même numéro dans la soirée). Un admin peut forcer via `force: true`.

</details>

<details>
<summary><b>🍟 Formules — <code>fixed</code> vs <code>supplement</code></b></summary>

```ts
// config/formulas.ts
menu_kids   → pricingMode: "fixed"       // le prix REMPLACE la variante
menu_burger → pricingMode: "supplement"  // le prix S'AJOUTE à la variante
```

Les options d'un choix (la boisson d'un menu) sont lues **dans le menu réel**, par nom de catégorie : ajouter une canette suffit à la proposer en formule, sans redéploiement.

`extraSizeReference` résout un cas fin : une formule `fixed` supprime la variante, donc la taille disparaît — un Menu Kids est alors facturé comme un **M** pour les extras tarifés par taille.

</details>

<details>
<summary><b>🧀 Groupes d'extras portés par le produit</b></summary>

Le libellé et la règle de choix unique appartiennent au **produit**, pas à l'ingrédient. Un même « Gouda » en base est :

- **Gratinage** (choix unique, tarifé M/L) sur un tacos
- **Suppléments** (cumulable, prix fixe) sur une pizza

Chaque option peut surcharger la tarification du `MenuExtra` (`priceType`, `price`, `pricesBySize`). Sans surcharge, celle du catalogue s'applique.

Avant ce modèle, le libellé vivait sur `MenuExtraType` et la liste des types à choix unique était une constante **du front** — donc jamais appliquée côté serveur.

</details>

<details>
<summary><b>🏪 Fermeture des commandes ≠ clôture du service</b></summary>

Deux interrupteurs distincts, souvent confondus :

| Action                                               | Effet                                                                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Fermer les commandes** (`PATCH /stores/status`)    | Coupe la porte d'entrée **client**. Le staff continue de saisir au comptoir. Les commandes en cours restent préparables et encaissables. |
| **Ouvrir un service** (`POST /orders/counter/reset`) | Remet la numérotation à zéro **et rouvre les commandes en ligne**                                                                        |

Un magasin sans document `StoreSettings` est considéré **ouvert** : aucune migration nécessaire, le document naît à la première fermeture.

</details>

<details>
<summary><b>➡️ Machine à états des commandes</b></summary>

```
pending ──► ready ──► out_for_delivery ──► completed
   │          │                              ▲
   │          └──────────────────────────────┘
   ├──► completed
   └──► cancelled
```

`completed` et `cancelled` sont **terminaux** : impossible de ressusciter une commande. `out_for_delivery` est réservé au type `delivery`.

`out_for_delivery → out_for_delivery` étant interdit, corriger un livreur après le départ passe par la route dédiée `PATCH /:id/delivery-person`.

</details>

<details>
<summary><b>🪑 Fusion automatique sur une table occupée</b></summary>

Une commande `dine_in` sur une table déjà occupée (`pending` ou `ready`) **est fusionnée** dans la commande existante — un groupe qui commande en deux fois ne produit pas deux tickets. Le HTTP renvoie **200** et non 201.

La `serviceDate` de la commande d'accueil est **conservée** : les articles ajoutés appartiennent au même service, quelle que soit l'heure.

La table n'est libérée qu'au passage en `completed`, jamais à `ready`.

</details>

---

## Sécurité

### Aucun prix ne vient du client

`resolveOrderItemsPricing` (`utils/pricing.ts`) est le cœur du système. Le client n'envoie que des **identifiants et des choix** — jamais un montant.

Le résolveur vérifie, pour chaque ligne :

1. Le produit existe et est **disponible**
2. La variante demandée **existe réellement** sur ce produit
3. La formule est **éligible à la catégorie** du produit
4. Chaque choix imposé correspond à un produit **disponible** de la bonne catégorie
5. Chaque extra est **proposé par ce produit** _(voir ci-dessous)_
6. Un groupe `singleChoice` ne reçoit **qu'une seule** valeur
7. Un extra `bySize` sans taille résoluble **échoue** au lieu de passer à 0 DA

> 🔒 **Correctif notable** — `availableExtras` était déclaré sur le modèle mais **lu nulle part côté serveur**. Un client pouvait joindre n'importe quel `extraId` à n'importe quel article : un gratinage sur une canette, facturé au prix d'un gratinage. `buildExtraContext` ferme cette brèche.

Le `totalPrice` est recalculé par un hook `pre("save")` du modèle, jamais accepté depuis une requête.

### Ce qu'un client anonyme ne voit jamais

`TRACKING_FIELDS` exclut **téléphone et adresse** du suivi public. Le détail chiffré, lui, est inclus — c'est ce que le client va payer.

`GET /lookup` renvoie **uniquement l'`_id`**, et son message d'échec est identique pour tous les cas (numéro inexistant, mauvais magasin, commande terminée) : distinguer les trois confirmerait à un curieux qu'un numéro existe.

### Rate limiting

| Route                | Limite / 15 min | Raison                                                                                      |
| -------------------- | --------------: | ------------------------------------------------------------------------------------------- |
| `POST /auth/login`   |               5 | Bruteforce de mot de passe                                                                  |
| `POST /orders`       |             100 | Anti-bot — **tous les clients du restaurant partagent le wifi**, donc une seule IP publique |
| `GET /orders/lookup` |              40 | Anti-énumération                                                                            |

> `/:id/track` est protégé par l'imprévisibilité d'un ObjectId de 24 caractères. `/lookup`, lui, se devine en deux paramètres (un magasin parmi deux, un numéro entre 1 et ~80) — sans limite, tout le service se recense en une minute.

### ReDoS

La recherche de l'historique passe par `$regex`. Sans échappement, une saisie comme `(a+)+$` construit une expression à **backtracking exponentiel**, exécutée par Mongo sur chaque document du périmètre — déni de service. Et un simple `(` lève une erreur de compilation, donc un 500 sur une frappe légitime.

```ts
// utils/escapeRegex.ts
value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
```

### Cloisonnement multi-magasin

`utils/storeScope.ts` centralise quatre règles, jamais réimplémentées ailleurs :

| Fonction                  | Rôle                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `resolveAccessibleStores` | Magasins consultables — un employé est **toujours** ramené au sien |
| `resolveTargetStore`      | Magasin cible d'une action d'administration                        |
| `assertSameStore`         | **403** sur une ressource d'un autre magasin                       |
| `getStoreFilter`          | Filtre Mongoose par rôle                                           |

Un livreur ne peut être assigné qu'à une course de **son** magasin (`assertAssignableDeliveryPerson`).

### Traçabilité

Supprimer une commande `completed` retire une vente du chiffre d'affaires. L'action est réservée aux admins **et journalisée** :

```
[SUPPRESSION VENTE] commande #42 (kouba, 1850 DA) supprimée par admin@niwafood.dz
```

### Cookie cross-domain

```ts
sameSite: isProduction ? "none" : "lax",
secure: isProduction,
```

`sameSite: "none"` est obligatoire dès que front et API sont sur deux sites (Vercel ↔ Render), et les navigateurs le refusent sans `secure`. En local, `localhost:3000 → localhost:5000` reste same-site (le port ne compte pas), donc `"lax"` suffit et évite d'imposer HTTPS.

`app.set("trust proxy", true)` est indispensable derrière Render : sans lui, `req.secure` reste `false` et Express refuse de poser un cookie `secure`.

---

## Performance

### Index, selon la règle ESR

```js
// Historique — Equality, Sort, Range
{ status: 1, type: 1, store: 1, serviceDate: -1, completedAt: -1 }

// Dashboard — rejoué toutes les 20 s par chaque poste ouvert
{ store: 1, status: 1, createdAt: -1 }

// Écran livreur — partiel, donc minuscule
{ deliveryPerson: 1, status: 1, createdAt: 1 }
  partialFilterExpression: { deliveryPerson: { $exists: true } }
```

> ⚠️ **`type` et `store` sont TOUJOURS présents dans le filtre**, y compris dans les vues « Tous » — sous forme de `$in` sur la liste complète. Les omettre romprait le **préfixe de l'index**, et MongoDB retomberait sur un `COLLSCAN` exactement dans les deux vues qui ratissent le plus. Un `$in` court reste servi par l'index.

### Deux requêtes plutôt qu'un `$facet`

L'historique lance `find()` et une agrégation de totaux **en parallèle**.

Un `$facet` unique aurait fait un seul aller-retour, mais MongoDB **n'utilise pas l'index pour trier à l'intérieur d'un facet** : il aurait chargé et trié en mémoire toutes les commandes de l'année, avec le plafond de 100 Mo au bout. Ici le `find` est servi par l'index, et le `$group` ne fait qu'accumuler des compteurs.

Le `$group` renvoie déjà `count` — pas de `countDocuments` supplémentaire.

### Projections et `.lean()`

`HISTORY_LIST_FIELDS` limite la liste à 9 champs : une commande complète pèse ~3 Ko avec ses items, soit 60 Ko pour une page de 20 — pour afficher quatre colonnes. `.lean()` évite de construire getters, setters et virtuels sur des documents qu'on ne fait que sérialiser.

Les stats de service tiennent en **un seul aller-retour par magasin** grâce à `$facet` (totaux, par statut, par type, top produits).

---

## Scripts de maintenance

À lancer avec `npx tsx src/scripts/<nom>.ts`. **Faire un `mongodump` avant toute migration.**

| Script                   | Rôle                                                                                  | Idempotent |
| ------------------------ | ------------------------------------------------------------------------------------- | :--------: |
| `createAdmin.ts`         | Crée le premier administrateur depuis les `SEED_ADMIN_*`                              |     ✅     |
| `migrateStores.ts`       | Renomme `staff` → `employee`, assigne un magasin par défaut                           |     ✅     |
| `migrateExtraGroups.ts`  | Convertit `availableExtras` en `extraGroups`, groupés par `MenuExtraType`             |     ✅     |
| `fixExtraGroups.ts`      | Recompose les groupes selon la règle métier réelle — **écrase les groupes existants** |     ⬜     |
| `backfillServiceDate.ts` | Remplit `serviceDate` sur les commandes antérieures au champ                          |     ✅     |
| `generateQRCode.ts`      | Génère le QR code de salle vers `${FRONTEND_URL}/commande`                            |     ✅     |

<details>
<summary><b>Pourquoi <code>fixExtraGroups</code> existe</b></summary>

`migrateExtraGroups` avait repris les `MenuExtraType` tels quels (« viande », « poisson », « légume »…), ce qui produisait **six groupes par pizza** et un « Gratinage » sur des produits qui n'en reçoivent pas.

Ces types décrivent la **nature** de l'ingrédient, pas la façon dont le client le choisit — deux notions qu'on avait confondues. `fixExtraGroups` repart d'une base saine : un groupe « Gratinage » (choix unique) sur les seuls tacos, un groupe « Suppléments » partout ailleurs. Aucun prix ne bouge, la tarification catalogue continue de s'appliquer.

</details>

<details>
<summary><b>L'approximation assumée de <code>backfillServiceDate</code></b></summary>

L'heure d'ouverture des services passés est irrécupérable — `Counter.lastResetAt` ne garde que celle du service courant. Le script applique donc une heuristique : **une commande créée avant 6h du matin appartient au service de la veille**. Exact dans l'immense majorité des cas, le service fermant à 00h30.

Écritures groupées par lots de 500 via `bulkWrite`, `$set` brut plutôt que `save()` — le hook `pre("save")` recalculerait `totalPrice` à partir de prix qui ont pu changer depuis, alors que l'historique doit refléter **ce qui a été facturé**.

</details>

---

## Structure du projet

```
src/
├── config/
│   ├── cloudinary.ts        cookies.ts       cors.ts
│   ├── db.ts                logger.ts        socket.ts
│   ├── formulas.ts          # menus, éligibilité, mode de tarification
│   ├── orderTypes.ts        stores.ts        # sources de vérité partagées
│
├── controllers/             # un par domaine — aucune logique réutilisable
│   ├── auth · menuCategory · menuExtraType · menuExtra · menuItem
│   └── order · storeSettings · table · upload
│
├── middlewares/
│   ├── auth.ts              # CheckAuth, optionalAuth, isStaff, isAdmin
│   ├── rateLimiters.ts      upload.ts
│   └── validations.ts       # validateBodySchema / validateQuerySchema (Zod)
│
├── models/                  # schémas Mongoose + hooks + index
│   ├── counter · menuCategory · menuExtra · menuExtraType
│   └── menuItem · order · storeSettings · table · user
│
├── routes/                  # câblage : route → validation → auth → contrôleur
│
├── scripts/                 # migrations et outillage
│
├── types/
│   ├── express.d.ts         # augmentation de Request.user
│   └── models/              # interfaces de domaine, documentées
│
├── utils/                   # logique métier pure, testable
│   ├── pricing.ts           # ⭐ résolution des prix côté serveur
│   ├── serviceDate.ts       # journée commerciale, bornes de calendrier
│   ├── storeScope.ts        # cloisonnement multi-magasin
│   ├── dailyNumber.ts       storeStatus.ts   orderEvents.ts
│   └── escapeRegex.ts       responseFormatter.ts
│
├── validation/              # schémas Zod, un par domaine
├── app.ts                   # pile Express + handler d'erreurs centralisé
└── index.ts                 # HTTP server + Socket.io + connexion DB
```

### Flux d'une requête

```
Requête
   ↓
CORS → Helmet → morgan → cookieParser → express.json
   ↓
Router          routes/*.routes.ts
   ↓
Rate limiter    (routes publiques sensibles)
   ↓
Validation      Zod — req.body / req.query remplacés par les données typées
   ↓
CheckAuth       charge req.user
   ↓
isStaff/isAdmin autorisation
   ↓
Contrôleur      orchestration, appelle utils/ et models/
   ↓
next(error) ──► handler centralisé (app.ts)
                 11000 → 409 · ValidationError → 400
                 statusCode custom → tel quel · JWT → 401 · sinon 500
```

---

## Déploiement

| Composant       | Plateforme                                                        |
| --------------- | ----------------------------------------------------------------- |
| API             | **Render**                                                        |
| Base de données | **MongoDB Atlas**                                                 |
| Images          | **Cloudinary**                                                    |
| Frontend        | **Vercel** — [niwa-food.vercel.app](https://niwa-food.vercel.app) |

**Configuration Render :**

```
Build Command : npm install && npm run build
Start Command : npm start
Node Version  : 22+
```

Variables à définir : toutes celles du tableau ci-dessus, avec `NODE_ENV=production`.

> ℹ️ Le front passe par un **rewrite Next** (`/api/*` → cette API) pour rendre le cookie _first-party_. Tout devient same-origin côté navigateur, mais `CORS_ORIGIN` reste nécessaire : le **handshake Socket.io**, lui, attaque l'API directement.

---

## Points d'attention

> Fichiers dupliqués côté frontend, à garder synchronisés manuellement :

| Backend                  | Frontend                                      | Conséquence d'une divergence                   |
| ------------------------ | --------------------------------------------- | ---------------------------------------------- |
| `config/formulas.ts`     | `src/config/formulas.ts`                      | Options affichées que l'API rejette en **400** |
| `config/stores.ts`       | `src/types/store.ts`                          | Magasin absent d'un sélecteur                  |
| `config/orderTypes.ts`   | `src/types/order.ts`                          | Onglet de filtre manquant                      |
| `ALLOWED_TRANSITIONS`    | `src/lib/orderTransitions.ts`                 | Bouton proposé qui échoue systématiquement     |
| `DEFAULT_CLOSED_MESSAGE` | `src/features/storeSettings/closedMessage.ts` | Deux formulations pour la même situation       |

> Dette technique connue :

- **`availableExtras` est déprécié** — conservé comme repli dans `buildExtraContext` et `resolveExtraGroups` le temps que tous les produits soient migrés. À supprimer une fois `fixExtraGroups` passé en production.
- **Pas de contrainte de cascade** sur la suppression d'une `MenuCategory` ou d'un `MenuExtraType` : les documents rattachés deviennent orphelins.

---

<div align="center">

**Développé par [Mehdi Abdi](https://github.com/mehdiabdi7)** — Projet final GoMyCode, Full Stack Web Developer

</div>
