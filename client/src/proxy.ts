import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "niwa_token";

// Doit rester aligné sur navConfig.ts. Un oubli ici ne crée pas de faille —
// le layout dashboard revérifie la session côté serveur — mais provoque un
// aller-retour inutile avant la redirection.
//
// /livraison en fait partie : c'est l'espace du livreur, aussi protégé que
// le reste, même s'il ne figure dans aucune barre de navigation.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/commandes",
  "/tables",
  "/menu",
  "/historique",
  "/promotions",
  "/utilisateurs",
  "/parametres",
  "/livraison",
];

/**
 * Premier filtre, exécuté avant tout rendu.
 *
 * Anciennement middleware.ts : Next 16 a renommé la convention en proxy. Le
 * nom de l'export doit suivre — une fonction encore appelée `middleware` dans
 * un fichier `proxy.ts` n'est pas reconnue.
 *
 * Il ne vérifie QUE la présence du cookie, jamais la signature du JWT : ce
 * code tourne sur le runtime Edge, où jsonwebtoken n'est pas disponible. Ce
 * n'est donc pas une barrière de sécurité, mais une optimisation qui évite de
 * rendre une page pour rien. L'autorisation réelle reste faite par le backend
 * à chaque appel, et par getSession() dans les layouts.
 *
 * Il ne connaît pas non plus le RÔLE, pour la même raison : c'est aux layouts
 * (dashboard) et (livraison) d'aiguiller chacun vers son espace.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Mémorise la destination pour y revenir après connexion : un employé qui
    // ouvre un lien direct vers une commande atterrit sur cette commande, pas
    // sur l'accueil du dashboard.
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Destination volontairement neutre : le rôle est inconnu ici, donc on
  // envoie vers /dashboard, et le layout redirigera un livreur vers
  // /livraison. Un aller-retour de plus, mais aucune supposition fausse.
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclut les assets et les routes internes : les faire passer par ce filtre
  // coûterait un appel par image chargée.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|mp4|ico)$).*)",
  ],
};
