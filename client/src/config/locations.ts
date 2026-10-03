import type { Store } from "@/types/store";

/**
 * Coordonnées réelles de Niwa Food.
 *
 * Source unique : ces données étaient recopiées dans Contact.tsx ET dans
 * Footer.tsx. Un numéro qui change se corrigeait donc à un endroit sur deux,
 * et le site finissait par afficher deux vérités. Tout ce qui affiche une
 * adresse, un horaire ou un réseau lit désormais ce fichier.
 */

export interface StoreLocation {
  slug: Store;
  name: string;
  /** Numéro tel qu'on le lit — l'espacement algérien, pas le format E.164. */
  phone: string;
  /** Le même, prêt pour un href tel: */
  phoneHref: string;
  address: string;
  /** Précision de quartier, quand elle existe. */
  addressDetail?: string;
  image: string;
  /** Cadrage du crop : l'enseigne n'est pas à la même hauteur sur les deux photos. */
  imagePosition: string;
  /**
   * Lien court officiel Google Maps. Il survit à un changement d'adresse ou
   * de nom de la fiche, contrairement à une URL construite à partir de
   * coordonnées, qui pointerait sur un point du sol.
   */
  mapUrl: string;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  {
    slug: "kouba",
    name: "Kouba",
    phone: "0552 52 00 76",
    phoneHref: "tel:+213552520076",
    address: "Parc Ben Omar",
    addressDetail: "Kouba, Alger",
    image: "/kouba.png",
    // L'enseigne est à mi-hauteur : un crop centré la garde entière.
    imagePosition: "object-center",
    mapUrl: "https://maps.app.goo.gl/s9XATgxV4YgfKnva8",
  },
  {
    slug: "cheraga",
    name: "Chéraga",
    phone: "0549 18 97 27",
    phoneHref: "tel:+213549189727",
    address: "Chéraga",
    addressDetail: "Alger Ouest",
    image: "/cheraga.png",
    // Photo en portrait, enseigne tout en haut : un crop centré la couperait.
    imagePosition: "object-top",
    mapUrl: "https://maps.app.goo.gl/g4mfVCriqtop4SwS7",
  },
];

/**
 * Horaires identiques sur les deux adresses.
 *
 * Le vendredi est traité à part parce que c'est le jour de congé ici : la
 * cuisine n'ouvre qu'au soir. L'annoncer clairement évite l'appel de midi
 * auquel personne ne répond.
 */
export const OPENING_HOURS = [
  { days: "Samedi à jeudi", hours: "11h00 – 00h30" },
  { days: "Vendredi", hours: "18h00 – 00h30" },
];

export const SOCIALS = [
  {
    href: "https://www.instagram.com/niwafood/",
    label: "Niwa Food sur Instagram",
    name: "Instagram",
    icon: "icon-[line-md--instagram]",
    bg: "bg-rose-500/20",
    fg: "bg-rose-600",
    text: "text-foreground",
  },
  {
    href: "https://www.facebook.com/niwafood",
    label: "Niwa Food sur Facebook",
    name: "Facebook",
    icon: "icon-[mdi--facebook]",
    bg: "bg-blue-700/30",
    fg: "bg-blue-700",
    text: "text-foreground",
  },
  {
    href: "https://www.tiktok.com/@niwafood",
    label: "Niwa Food sur Tiktok",
    name: "TikTok",
    icon: "icon-[line-md--tiktok]",
    bg: "bg-black/80",
    fg: "bg-white",
    // Fond sombre dans les deux thèmes : texte blanc, contrairement aux
    // deux fonds pâles ci-dessus qui prennent la couleur du thème.
    text: "text-white",
  },
];

/**
 * Nombre d'abonnés Instagram, arrondi.
 *
 * Chiffre RÉEL relevé sur le compte, et le seul argument de confiance dont
 * dispose un fast-food de quartier face à une chaîne. À rafraîchir de temps en
 * temps : un compteur qui stagne pendant deux ans se retourne contre vous.
 */
export const INSTAGRAM_FOLLOWERS = "29 000";
