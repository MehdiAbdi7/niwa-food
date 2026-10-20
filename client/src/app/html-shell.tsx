import type { Metadata } from "next";

// Polices servies depuis notre propre domaine via Fontsource, et non par un
// <link> vers Google Fonts. Une feuille externe bloque le premier rendu, et
// celle de Google impose deux allers-retours réseau avant le premier pixel :
// résolution DNS + TLS pour googleapis.com, téléchargement du CSS, puis
// découverte des fichiers sur gstatic.com et nouvelle connexion.
//
// next/font/google ferait la même chose à la compilation, mais Turbopack ne
// résout pas ses URLs en dev ("@vercel/turbopack-next/internal/font/google").
// Fontsource contourne le problème : ce sont de simples imports npm, donc les
// fichiers sont traités comme n'importe quel asset du projet.
//
// Les familles correspondantes sont déclarées dans globals.css
// (--font-heading / --font-body).
import "@fontsource-variable/dm-sans";
import "@fontsource/baloo-2/400.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";
// Polices arabes : déclarées partout, mais utilisées seulement par les pages
// en arabe (html[lang="ar"] dans globals.css). Un navigateur ne télécharge
// une police que si une page s'en sert : les pages en français et en
// anglais ne paient rien.
import "@fontsource-variable/baloo-bhaijaan-2";
import "@fontsource-variable/noto-sans-arabic";

import "./globals.css";
import { Providers } from "./providers";
import { DEMO_MODE, SITE_URL } from "@/config/site";

/**
 * Métadonnées communes au site public et au back-office. Chaque layout
 * racine y ajoute son titre et sa description.
 */
export const sharedMetadata: Metadata = {
  // Base des URL absolues : sans elle, l'image d'aperçu resterait un chemin
  // relatif, que WhatsApp et Facebook ignorent.
  metadataBase: new URL(SITE_URL),
  twitter: { card: "summary_large_image" },
  // En démo, rien n'est indexé : un moteur de recherche ne doit pas présenter
  // ce site comme celui du restaurant. Voir config/site.ts.
  robots: DEMO_MODE ? { index: false, follow: false } : undefined,
};

const themeInitScript = `
(function() {
  try {
    const stored = localStorage.getItem("theme");
    const mode = stored || "system";
    const isDark = mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // localStorage indisponible (navigation privée stricte, cookies bloqués...)
    // → on ignore, la page reste simplement en mode clair par défaut
  }
})();
`;

interface HtmlShellProps {
  lang: string;
  dir: "ltr" | "rtl";
  children: React.ReactNode;
}

/**
 * Le document HTML, commun aux deux layouts racines.
 *
 * Il y en a deux depuis l'arrivée des langues : app/[lang]/layout.tsx pour
 * le site public, qui doit écrire la langue de la page dans <html lang dir>,
 * et app/(staff)/layout.tsx pour le back-office, toujours en français. Un
 * layout racine unique ne connaîtrait pas le [lang] de l'URL, qui est plus
 * bas que lui dans l'arbre.
 *
 * `dir` sur <html> et non sur un <div> : les fenêtres (panier, fiche
 * produit) sont rendues dans <body> par un portail, hors de tout <div> du
 * layout. Posé ici, le sens de lecture s'applique aussi à elles.
 */
export function HtmlShell({ lang, dir, children }: HtmlShellProps) {
  return (
    <html
      lang={lang}
      dir={dir}
      // overflow-x-clip (pas overflow-x-hidden) : "hidden" force silencieusement
      // overflow-y à "auto" quand overflow-y n'est pas précisé (règle CSS peu
      // connue) — html/body deviennent alors des conteneurs de scroll, ce qui
      // casse position:sticky pour la sidebar et la topbar.
      className="h-full antialiased overflow-x-clip"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
