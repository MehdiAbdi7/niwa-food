"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useNavbar } from "@/features/navbar/useNavbar";
import { ThemeToggle } from "./themeToggle";
import { CartButton } from "./CartButton";
import { TrackOrderButton } from "./TrackOrderButton";
import { DemoBanner } from "./DemoBanner";

// « Suivi » rejoint la barre : c'est la seule façon, pour un client qui a
// fermé son onglet ou changé de téléphone, de retrouver sa commande. Le
// raccourci TrackOrderButton ne couvre que le même appareil, et son TTL est
// de six heures.
const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/commande", label: "Menu" },
  { href: "/commande/suivi", label: "Suivi" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

// L'accueil doit être une correspondance EXACTE : startsWith("/") serait vrai
// pour toutes les routes du site, et les liens s'allumeraient ensemble.
//
// « Menu » (/commande) demande le même traitement depuis l'ajout de « Suivi » :
// /commande/suivi commence par /commande, donc les deux liens s'allumeraient
// à la fois sur la page de suivi. On sort donc /commande de la règle par
// préfixe — ses sous-pages (finaliser, suivi) ne sont pas « le menu ».
const EXACT_MATCH_ONLY = ["/", "/commande"];

function isActiveLink(pathname: string, href: string): boolean {
  if (EXACT_MATCH_ONLY.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const Navbar = () => {
  const { isScrolled, isMenuOpen, toggleMenu, closeMenu } = useNavbar();
  const pathname = usePathname();

  return (
    // Au défilement, le header prend la couleur du fond et non plus
    // bg-primary : sur un fond primary plein, ni « NIWA » ni la moutarde de
    // « FOOD » n'atteignaient 4,5:1. Les textes gardent ainsi les mêmes
    // couleurs dans les deux états, seuls le fond et l'ombre apparaissent.
    <header
      className={`fixed z-40 w-full transition-all duration-300 ease-in ${
        isScrolled || isMenuOpen
          ? "bg-background shadow-md shadow-primary/20"
          : "bg-transparent"
      }`}
    >
      <DemoBanner />
      <nav className="mx-auto max-w-5xl flex w-full items-center justify-between border-b border-primary lg:border-none px-2 py-2 text-primary transition-colors duration-300 ease-in-out sm:justify-between">
        <Link
          href="/"
          className="flex items-center justify-center gap-0.5 sm:gap-1 "
          onClick={closeMenu}
        >
          {/* Hauteur fixée en CSS, largeur en auto : le rapport d'aspect réel
              du fichier est respecté, et Next n'a plus de divergence à
              signaler entre les dimensions déclarées et le rendu.
              alt vide : le texte « NIWA FOOD » juste à côté nomme déjà le
              lien, un alt le ferait lire deux fois par les lecteurs d'écran.
              loading="eager" sans preload : le logo est au-dessus de la
              ligne de flottaison, mais la priorité réseau revient à la photo
              du hero, qui est l'élément LCP. */}
          <Image
            src="/logo-niwa.png"
            alt=""
            width={55}
            height={55}
            loading="eager"
            className="h-14 w-auto shrink-0"
          />
          <span className="font-heading text-sm text-accent-mustard-text font-semibold  sm:text-xl hover:scale-110">
            <span className="text-lg text-foreground sm:text-xl">NIWA</span>{" "}
            FOOD
          </span>
        </Link>

        {/* Liens desktop — gap resserré depuis l'ajout de « Suivi » : à gap-8,
            cinq entrées débordaient de la pilule au point de bascule md. */}
        <div className="hidden items-center gap-5 font-heading text-sm font-bold shadow-[0_0_20px_5px_rgba(217,169,77,0.45)] shadow-primary/30 md:flex md:bg-background md:rounded-4xl md:px-5 md:py-2 lg:gap-7 lg:px-6">
          {NAV_LINKS.map((link) => {
            const isActive = isActiveLink(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                // aria-current plutôt qu'une simple couleur : la page courante
                // doit être annoncée, pas seulement montrée.
                aria-current={isActive ? "page" : undefined}
                className={`group relative whitespace-nowrap py-1 transition-colors duration-300 ease-out ${
                  isActive
                    ? "text-accent-mustard-text"
                    : "text-foreground dark:text-foreground hover:text-accent-mustard-text"
                }`}
              >
                {link.label}
                {/* Le soulignement est déjà déployé sur la page courante, et
                    se déploie au survol ailleurs : une seule mécanique pour
                    deux états, donc rien de nouveau à comprendre. */}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full origin-left bg-accent-mustard transition-transform duration-500 ease-out ${
                    isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* gap resserré sur mobile : panier, suivi, thème et hamburger se
            partagent la place. Les deux premiers ne s'affichent que lorsqu'ils
            ont quelque chose à montrer, donc les quatre sont rarement là
            ensemble. */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Raccourci vers la dernière commande de CET appareil : zéro saisie.
              Complémentaire du lien « Suivi », qui couvre tous les autres cas
              (autre téléphone, navigation privée, localStorage vidé). */}
          <TrackOrderButton />
          <CartButton />
          <ThemeToggle />
          <Link
            href="/commande"
            className="hidden rounded-full bg-primary px-5 py-2 font-bold text-background transition-all duration-200 ease-in-out hover:scale-105 hover:bg-accent-green lg:inline-block"
          >
            Commander
          </Link>

          {/* Bouton hamburger — visible uniquement mobile */}
          <button
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-current/10 md:hidden"
          >
            <span
              className={`absolute h-0.5 w-5 rounded-full bg-foreground/80 transition-all duration-300 ease-in-out ${
                isMenuOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute h-0.5 w-5 rounded-full bg-foreground/80 transition-all duration-300 ease-in-out ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute h-0.5 w-5 rounded-full bg-foreground/80 transition-all duration-300 ease-in-out ${
                isMenuOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Overlay sombre derrière le panneau */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 -z-10 bg-black/10 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Panneau mobile — slide depuis la droite.
          aria-labelledby et non aria-label : un rôle "dialog" sans nom
          accessible est annoncé « dialogue » tout court, sans dire lequel.
          On pointe vers le titre visible du panneau plutôt que de dupliquer
          un libellé qui pourrait diverger. */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        className={`fixed top-0 right-0 z-40 h-dvh w-full  bg-background text-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* En-tête du panneau : logo + croix de fermeture */}
          <div className="flex items-center justify-between border-b border-on-primary/10 px-4 py-4">
            <Link
              href="/"
              id="mobile-menu-title"
              className="flex items-center justify-center gap-0.5 sm:gap-1 shadow-[0_0_20px_5px_rgba(217,169,77,0.45)] shadow-primary/30 rounded-4xl px-4 "
              onClick={closeMenu}
            >
              <Image
                src="/logo-niwa.png"
                alt=""
                width={48}
                height={48}
                className="h-12 w-auto shrink-0"
              />
              <span className="font-heading text-sm text-accent-mustard-text font-semibold  sm:text-xl hover:scale-110">
                <span className="text-lg text-foreground sm:text-xl">NIWA</span>{" "}
                FOOD
              </span>
            </Link>
            <button
              onClick={closeMenu}
              aria-label="Fermer le menu"
              className="flex h-9 w-9 text-primary cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-on-primary/10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Liens — gap-6 depuis l'ajout de « Suivi » : à gap-8, cinq entrées
              plus le bouton du bas dépassaient sur un écran de 640 px. */}
          <div className="flex flex-1 flex-col gap-6 px-6 pt-6">
            {NAV_LINKS.map((link, index) => {
              const isActive = isActiveLink(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={isActive ? "page" : undefined}
                  // Hors du parcours clavier quand le panneau est refermé : il
                  // reste dans le DOM, translaté hors écran, donc ses liens
                  // seraient encore focalisables sans ce garde.
                  tabIndex={isMenuOpen ? undefined : -1}
                  style={{
                    transitionDelay: isMenuOpen ? `${index * 60}ms` : "0ms",
                  }}
                  className={`flex items-center justify-between rounded-2xl border-b px-4 py-3 font-heading text-lg font-semibold transition-all duration-300 ease-out ${
                    isActive
                      ? "border-accent-mustard bg-primary/10 text-accent-mustard-text"
                      : "border-primary text-foreground"
                  } ${
                    isMenuOpen
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="icon-[mdi--circle-medium] text-xl"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA en bas du panneau */}
          <div className="px-6 pb-8">
            <Link
              href="/commande"
              onClick={closeMenu}
              tabIndex={isMenuOpen ? undefined : -1}
              className="block rounded-full border-b border-primary bg-on-primary px-5 py-3 text-center font-bold text-primary transition-colors duration-200 hover:bg-background hover:text-accent-slate"
            >
              Commander
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
