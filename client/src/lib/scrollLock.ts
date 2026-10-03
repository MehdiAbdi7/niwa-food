/**
 * Verrou de défilement de la page, partagé par toutes les surfaces modales.
 *
 * Deux pièges que la solution naïve (`body.style.overflow = "hidden"`) ignore :
 *
 * 1. Le navigateur ne propage l'overflow du <body> au viewport que si le
 *    <html> a un overflow VISIBLE. Notre layout pose `overflow-x-clip` sur
 *    <html> (indispensable au sticky de la sidebar), donc la propagation est
 *    coupée et le verrou n'a tout simplement aucun effet.
 *
 * 2. Safari iOS ignore de toute façon `overflow: hidden` sur le rubber-band.
 *    Seul `position: fixed` retient réellement la page — d'où la mémorisation
 *    puis la restauration de scrollY, sans quoi ouvrir une fiche renverrait
 *    le client en haut de la carte.
 *
 * Le compteur gère l'imbrication : le ticket peut ouvrir une fiche produit,
 * et fermer la fiche ne doit pas déverrouiller la page pendant que le ticket
 * est encore là.
 *
 * La position n'est restaurée que sur la page où le verrou a été posé. Le
 * ticket se ferme parfois PARCE QU'on change de page (« Finaliser ma
 * commande ») : restaurer alors la position de la carte, 1 500 px plus bas,
 * ouvrait la page de finalisation directement sur son pied de page.
 */

let lockCount = 0;
let savedScrollY = 0;
let savedPathname = "";

export function lockScroll(): void {
  if (typeof document === "undefined") return;

  lockCount += 1;
  if (lockCount > 1) return; // déjà verrouillé par une surface parente

  savedScrollY = window.scrollY;
  savedPathname = window.location.pathname;

  const { style } = document.body;

  // Compense la disparition de la barre de défilement : sans ça, tout le
  // contenu se décale de ~15px sur desktop au moment de l'ouverture.
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) style.paddingRight = `${scrollbarWidth}px`;

  style.position = "fixed";
  style.top = `-${savedScrollY}px`;
  style.left = "0";
  style.right = "0";
  style.width = "100%";
  // Ceinture et bretelles : couvre les navigateurs où position:fixed seul
  // laisserait passer un défilement résiduel.
  style.overflow = "hidden";
}

export function unlockScroll(): void {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return; // une surface parente garde le verrou

  const { style } = document.body;

  style.position = "";
  style.top = "";
  style.left = "";
  style.right = "";
  style.width = "";
  style.overflow = "";
  style.paddingRight = "";

  // Nouvelle page : on la commence en haut, comme toute navigation.
  const isSamePage = window.location.pathname === savedPathname;

  // instant et non smooth : le client doit retrouver sa place immédiatement,
  // pas voir la page remonter en glissant après avoir fermé une fiche.
  window.scrollTo({ top: isSamePage ? savedScrollY : 0, behavior: "instant" });
}
