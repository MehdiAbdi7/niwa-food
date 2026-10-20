import Image from "next/image";
import Link from "next/link";
import { SOCIALS, STORE_LOCATIONS } from "@/config/locations";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { fill } from "@/i18n/text";

// Mêmes destinations que la barre du haut : deux listes qui divergent, c'est
// un visiteur qui atterrit ailleurs selon l'endroit où il a cliqué. « Suivi »
// y figure donc aussi. Le libellé est une clé de dict.nav.
const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/commande", label: "menu" },
  { href: "/commande/suivi", label: "trackingLong" },
  { href: "/a-propos", label: "about" },
  { href: "/contact", label: "contact" },
] as const;

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

// Composant serveur : il reçoit la langue et ses textes du layout, au lieu
// de les lire avec useI18n(), réservé aux composants client.
const Footer = ({ locale, dict }: FooterProps) => {
  return (
    <footer className="relative isolate overflow-hidden border-t border-primary/20 bg-primary/5 dark:bg-primary/10 px-6 pt-14 pb-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        {/* Bloc marque */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-start md:max-w-xs">
          <Link href={localizePath(locale, "/")} className="flex items-center gap-1">
            {/* Hauteur fixée en CSS, largeur en auto : le rapport d'aspect
                réel du fichier est respecté quel qu'il soit, et Next n'a plus
                de divergence à signaler entre les dimensions déclarées et le
                rendu. shrink-0 empêche le parent flex de comprimer le logo. */}
            <Image
              src="/logo-niwa.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-auto shrink-0"
            />
            <span className="font-heading text-lg font-semibold text-accent-mustard-text sm:text-xl">
              <span className="text-foreground">Niwa</span> Food
            </span>
          </Link>

          <p className="text-sm leading-relaxed text-foreground/70">
            {dict.footer.tagline}
          </p>

          {/* Réseaux sociaux */}
          <div className="mt-1 flex items-center gap-2">
            {SOCIALS.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={fill(dict.socialLabel, { network: social.name })}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 ${social.bg}`}
              >
                <span
                  aria-hidden="true"
                  className={`${social.icon} ${social.fg} text-xl`}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-start">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            {dict.footer.navigation}
          </span>

          {/* Plus de gap, un py-1 sur chaque lien à la place : même rythme
              visuel, mais des cibles de 28 px de haut au lieu de 20, au-dessus
              du minimum de 24 px que demande le WCAG 2.2 au doigt. */}
          <div className="flex flex-col items-center md:items-start">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={localizePath(locale, link.href)}
                className="inline-block py-1 text-sm text-foreground/70 transition-colors hover:text-accent-green"
              >
                {dict.nav[link.label]}
              </Link>
            ))}
          </div>
        </div>

        {/* Adresses */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-start">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            {dict.footer.addresses}
          </span>

          <div className="flex flex-col gap-4">
            {STORE_LOCATIONS.map((location) => (
              <div
                key={location.slug}
                className="flex flex-col items-center md:items-start"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--map-marker] text-accent-green"
                  />
                  {dict.stores[location.slug].name}
                </span>

                {/* dir="ltr" : un numéro de téléphone se lit de gauche à
                    droite, même au milieu d'une page en arabe. */}
                <a
                  href={location.phoneHref}
                  dir="ltr"
                  className="inline-block py-1 text-sm text-foreground/70 transition-colors hover:text-accent-green"
                >
                  {location.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA commande */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-start">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            {dict.footer.hungry}
          </span>

          <p className="max-w-40 text-sm text-foreground/70">
            {dict.footer.hungryText}
          </p>

          <Link
            href={localizePath(locale, "/commande")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-bold text-background dark:bg-primary-dark dark:text-foreground transition-all duration-300 ease-in-out hover:scale-105 hover:bg-accent-slate"
          >
            {dict.common.order}
            <span
              aria-hidden="true"
              className="icon-[line-md--arrow-right-circle-twotone] text-lg rtl:-scale-x-100"
            />
          </Link>
        </div>
      </div>

      {/* Barre du bas */}
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center gap-3 border-t border-primary/20 pt-6 text-center text-xs text-foreground/75 sm:flex-row sm:justify-between sm:text-start">
        <p>{fill(dict.footer.rights, { year: new Date().getFullYear() })}</p>
        <p>{dict.footer.credit}</p>
      </div>
    </footer>
  );
};

export default Footer;
