import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable — Niwa Food",
};

/**
 * Page 404 de tout le site.
 *
 * Sans ce fichier, Next affiche sa page par défaut, en anglais, sur un site
 * entièrement en français. Elle vit à la racine de app/ et non dans
 * (public) : une URL inconnue n'appartient à aucun groupe de routes, c'est
 * donc ce fichier-ci qui répond, sans la navbar ni le footer du site public.
 * D'où les deux sorties proposées : l'accueil et la carte, les deux pages
 * qu'un client perdu cherche le plus souvent.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 py-20 text-center text-foreground">
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
          Cette page n&apos;est pas sur la carte
        </h1>
        <p className="text-sm leading-relaxed text-foreground/75">
          Le lien est peut-être erroné, ou la page a été déplacée. Le menu, lui,
          est toujours là.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/commande"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-heading font-bold text-on-primary transition-colors hover:bg-accent-slate"
        >
          Voir la carte
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-heading font-bold text-foreground transition-colors hover:bg-primary/10"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
