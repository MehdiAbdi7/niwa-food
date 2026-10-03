import Image from "next/image";
import Link from "next/link";
import { SOCIALS, STORE_LOCATIONS } from "@/config/locations";

// Mêmes destinations que la barre du haut : deux listes qui divergent, c'est
// un visiteur qui atterrit ailleurs selon l'endroit où il a cliqué. « Suivi »
// y figure donc aussi.
const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/commande", label: "Menu" },
  { href: "/commande/suivi", label: "Suivi de commande" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

const Footer = () => {
  return (
    <footer className="relative isolate overflow-hidden border-t border-primary/20 bg-primary/5 dark:bg-primary/10 px-6 pt-14 pb-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        {/* Bloc marque */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left md:max-w-xs">
          <Link href="/" className="flex items-center gap-1">
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
            Burgers, tacos et pizzas préparés minute, 100% faits maison. Sur
            place, à emporter, ou livrés chez vous.
          </p>

          {/* Réseaux sociaux */}
          <div className="mt-1 flex items-center gap-2">
            {SOCIALS.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
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
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            Navigation
          </span>

          {/* Plus de gap, un py-1 sur chaque lien à la place : même rythme
              visuel, mais des cibles de 28 px de haut au lieu de 20, au-dessus
              du minimum de 24 px que demande le WCAG 2.2 au doigt. */}
          <div className="flex flex-col items-center md:items-start">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-block py-1 text-sm text-foreground/70 transition-colors hover:text-accent-green"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Adresses */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            Nos adresses
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
                  {location.name}
                </span>

                <a
                  href={location.phoneHref}
                  className="inline-block py-1 text-sm text-foreground/70 transition-colors hover:text-accent-green"
                >
                  {location.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* CTA commande */}
        <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
          <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
            Envie de manger ?
          </span>

          <p className="max-w-40 text-sm text-foreground/70">
            Composez votre commande en quelques clics.
          </p>

          <Link
            href="/commande"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-bold text-background dark:bg-primary-dark dark:text-foreground transition-all duration-300 ease-in-out hover:scale-105 hover:bg-accent-slate"
          >
            Commander
            <span
              aria-hidden="true"
              className="icon-[line-md--arrow-right-circle-twotone] text-lg"
            />
          </Link>
        </div>
      </div>

      {/* Barre du bas */}
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center gap-3 border-t border-primary/20 pt-6 text-center text-xs text-foreground/75 sm:flex-row sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} Niwa Food — Tous droits réservés</p>
        <p>Développé par Mehdi Abdi</p>
      </div>
    </footer>
  );
};

export default Footer;
