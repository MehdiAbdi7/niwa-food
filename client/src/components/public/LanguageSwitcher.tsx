"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import {
  LOCALES,
  LOCALE_NAMES,
  localizePath,
  stripLocale,
  type Locale,
} from "@/i18n/config";

// Libellé court, pour tenir dans la barre. Le nom complet (LOCALE_NAMES) est
// lu par les lecteurs d'écran et affiché au survol.
const SHORT_LABELS: Record<Locale, string> = {
  fr: "FR",
  ar: "ع",
  en: "EN",
};

/**
 * Un lien par langue, vers la page courante dans cette langue.
 *
 * De vrais liens et non un <select> : ils marchent sans JavaScript, et les
 * moteurs de recherche les suivent pour découvrir les trois versions.
 */
function LanguageLinks({ onSelect }: { onSelect?: () => void }) {
  const { locale } = useI18n();
  const router = useRouter();
  // La même page, sans sa langue : "/ar/contact" donne "/contact".
  const pathname = stripLocale(usePathname());

  return LOCALES.map((target) => {
    const href = localizePath(target, pathname);
    const isCurrent = target === locale;

    return (
      <Link
        key={target}
        href={href}
        // Pas de préchargement : ces liens sont visibles sur toutes les
        // pages, Next téléchargerait les deux autres langues à chaque visite
        // pour un clic rare.
        prefetch={false}
        hrefLang={target}
        lang={target}
        title={LOCALE_NAMES[target]}
        aria-label={LOCALE_NAMES[target]}
        aria-current={isCurrent ? "true" : undefined}
        onClick={(event) => {
          // Garde les paramètres de l'adresse (?store=...&table=...) : un
          // client assis à table qui change de langue ne doit pas perdre sa
          // table. Lus au clic, et non au rendu, pour que le HTML du serveur
          // et celui du navigateur restent identiques.
          event.preventDefault();
          router.push(`${href}${window.location.search}`);
          onSelect?.();
        }}
        className={`flex h-7 min-w-8 items-center justify-center rounded-full px-2 font-heading text-xs font-bold transition-colors ${
          isCurrent
            ? "bg-foreground text-background"
            : "text-foreground/80 hover:text-accent-green"
        }`}
      >
        {SHORT_LABELS[target]}
      </Link>
    );
  });
}

interface LanguageSwitcherProps {
  /** Appelé après le choix : sert à refermer le panneau mobile. */
  onSelect?: () => void;
  className?: string;
}

/** Les trois langues côte à côte : panneau du menu mobile. */
export function LanguageSwitcher({
  onSelect,
  className = "",
}: LanguageSwitcherProps) {
  const { dict } = useI18n();

  return (
    <nav
      aria-label={dict.nav.language}
      className={`flex items-center gap-1 rounded-full border-2 border-foreground/80 bg-primary/20 p-0.5 backdrop-blur-2xl ${className}`}
    >
      <LanguageLinks onSelect={onSelect} />
    </nav>
  );
}

/**
 * Bouton rond qui déplie les langues : barre du haut.
 *
 * La barre ne dépasse jamais 1024 px (max-w-5xl) et porte déjà le suivi, le
 * panier et le thème : la rangée de trois boutons y écrasait le logo. Ce
 * bouton prend la place du bouton de thème, 36 px.
 *
 * <details> et <summary> : l'ouverture et la fermeture au clic sont gérées
 * par le navigateur, sans state React. Seule la fermeture au clic à
 * l'extérieur est ajoutée.
 */
export function LanguageMenu({ className = "" }: { className?: string }) {
  const { locale, dict } = useI18n();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      const details = detailsRef.current;
      if (details && !details.contains(event.target as Node)) {
        details.open = false;
      }
    };

    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, []);

  return (
    <details ref={detailsRef} className={`relative ${className}`}>
      {/* list-none et le marqueur WebKit masqué : sans eux, le navigateur
          dessine un petit triangle devant le libellé. */}
      <summary
        aria-label={dict.nav.language}
        title={dict.nav.language}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border-2 border-foreground/80 bg-primary/20 font-heading text-xs font-bold text-foreground/80 backdrop-blur-2xl transition-colors hover:border-accent-green hover:text-accent-green [&::-webkit-details-marker]:hidden"
      >
        {SHORT_LABELS[locale]}
      </summary>

      <nav
        aria-label={dict.nav.language}
        className="absolute end-0 top-11 flex flex-col gap-1 rounded-2xl border border-primary/30 bg-background p-1.5 shadow-lg"
      >
        <LanguageLinks
          onSelect={() => {
            if (detailsRef.current) detailsRef.current.open = false;
          }}
        />
      </nav>
    </details>
  );
}
