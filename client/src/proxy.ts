import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, hasLocale, stripLocale } from "@/i18n/config";

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

function isStaffPath(pathname: string): boolean {
  return [...PROTECTED_PREFIXES, "/login"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Premier filtre, exécuté avant tout rendu.
 *
 * Anciennement middleware.ts : Next 16 a renommé la convention en proxy. Le
 * nom de l'export doit suivre — une fonction encore appelée `middleware` dans
 * un fichier `proxy.ts` n'est pas reconnue.
 *
 * Deux aiguillages : le back-office (connexion obligatoire, toujours en
 * français) et le site public (langue lue dans l'adresse).
 */
export function proxy(request: NextRequest) {
  if (isStaffPath(request.nextUrl.pathname)) return staffProxy(request);
  return localeProxy(request);
}

/**
 * Langue du site public.
 *
 * Toutes les pages publiques vivent dans app/[lang]. Le français n'a pas de
 * préfixe dans l'adresse, donc ses pages y sont envoyées par une RÉÉCRITURE :
 * le navigateur affiche /commande, Next rend /fr/commande. Une redirection
 * ajouterait un aller-retour réseau à chaque visite.
 */
function localeProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  // /fr/contact → /contact : une seule adresse par page française. Deux
  // adresses pour le même contenu, Google y voit un doublon.
  if (firstSegment === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = stripLocale(pathname);
    return NextResponse.redirect(url, 308);
  }

  // /ar/... et /en/... existent tels quels dans app/[lang].
  if (hasLocale(firstSegment)) return NextResponse.next();

  // Le reste est en français. La requête garde ses paramètres (?store=...
  // des QR codes), seul le chemin change.
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Accès au back-office.
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
function staffProxy(request: NextRequest) {
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
  // coûterait un appel par image chargée. Depuis les langues, c'est aussi
  // une question de justesse : robots.txt, sitemap.xml ou les fichiers de
  // Next (_next, __nextjs en développement) seraient sinon réécrits en
  // /fr/robots.txt, qui n'existe pas.
  matcher: [
    "/((?!api|_next|__next|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|mp4|ico|txt|xml)$).*)",
  ],
};
