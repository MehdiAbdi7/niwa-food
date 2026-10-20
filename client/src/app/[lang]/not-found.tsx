"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/config";

/**
 * Page 404 du site public, dans la langue de l'adresse.
 *
 * Sans ce fichier, Next affiche sa page par défaut, en anglais. Elle
 * s'affiche dans le layout public, donc avec la navbar et le footer. D'où
 * les deux sorties proposées : l'accueil et la carte, les deux pages qu'un
 * client perdu cherche le plus souvent.
 *
 * Composant client : un not-found.tsx ne reçoit pas les params de l'URL, il
 * lit donc la langue avec useI18n(), fourni par le layout. Pour la même
 * raison, il ne peut pas exporter de metadata : le titre de l'onglet est
 * posé par la balise <title>, que React place lui-même dans le <head>.
 */
export default function NotFound() {
  const { locale, dict } = useI18n();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 pb-20 pt-36 text-center text-foreground">
      <title>{dict.notFound.metaTitle}</title>

      <Image
        src="/logo-niwa.png"
        alt=""
        width={96}
        height={96}
        className="h-24 w-auto"
      />

      <p className="font-heading text-7xl font-bold text-primary">404</p>

      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-accent-green sm:text-3xl">
          {dict.notFound.title}
        </h1>
        <p className="text-sm leading-relaxed text-foreground/75">
          {dict.notFound.text}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={localizePath(locale, "/commande")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-heading font-bold text-on-primary transition-colors hover:bg-accent-slate"
        >
          {dict.common.seeMenu}
        </Link>
        <Link
          href={localizePath(locale, "/")}
          className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-heading font-bold text-foreground transition-colors hover:bg-primary/10"
        >
          {dict.notFound.home}
        </Link>
      </div>
    </div>
  );
}
