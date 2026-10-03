import Link from "next/link";
import type { Metadata } from "next";
import { FixedBackground } from "@/components/public/FixedBackground";
import { PageHero } from "@/components/public/PageHero";
import { INSTAGRAM_FOLLOWERS } from "@/config/locations";

export const metadata: Metadata = {
  title: "À propos — Niwa Food",
  description:
    "Burgers artisanaux, tacos et pizzas préparés minute à Kouba et Chéraga. Un menu qui porte les noms des légendes de la route.",
  openGraph: {
    title: "À propos — Niwa Food",
    description:
      "Le burger artisanal, préparé minute. Deux adresses à Alger, un menu nommé comme un garage.",
  },
};

/**
 * Le décodeur du menu — l'élément signature de cette page.
 *
 * Chaque plat de la carte porte le nom d'une référence de l'univers du scooter
 * et de la moto. C'est vrai, c'est vérifiable, et c'est la seule chose de ce
 * site qu'aucun concurrent d'Alger ne peut recopier — un texte générique sur
 * « la passion du goût », si.
 *
 * Contenu éditorial, volontairement séparé de la base : on décrit ici la
 * MARQUE moto, pas le plat. La ligne reste donc juste même si la recette
 * change de nom ou sort de la carte.
 */
const GARAGE_NAMES = [
  { name: "TMAX", meaning: "Le maxi-scooter Yamaha" },
  { name: "NMAX", meaning: "Son petit frère, plus nerveux" },
  { name: "VESPA", meaning: "L'italien qui a tout commencé" },
  { name: "GILERA", meaning: "Constructeur italien de motos" },
  { name: "POLINI", meaning: "Préparateur moteur italien" },
  { name: "MALOSSI", meaning: "Pièces de performance pour scooters" },
  { name: "GIVI", meaning: "Bagagerie et top-cases" },
  { name: "ARAI", meaning: "Les casques japonais" },
  { name: "J-COSTA", meaning: "Variateurs de transmission" },
];

const METHOD = [
  {
    icon: "icon-[mdi--bread-slice-outline]",
    title: "Le pain, toasté minute",
    text: "Aucun burger n'attend sous une lampe. Le pain passe au grill au moment où la commande tombe, pas avant.",
  },
  {
    icon: "icon-[mdi--water]",
    title: "Les sauces, faites ici",
    text: "L'américaine, l'orientale, la blanche : elles sortent de notre cuisine, pas d'un bidon. C'est ce qui fait qu'un burger a un goût qu'on ne retrouve pas ailleurs.",
  },
  {
    icon: "icon-[mdi--fire]",
    title: "La viande, jamais à l'avance",
    text: "Steak haché frais, saisi à la commande. Une viande cuite d'avance perd son jus en dix minutes — on ne prend pas ce raccourci.",
  },
  {
    icon: "icon-[mdi--moped]",
    title: "Livré tant que c'est chaud",
    text: "Sur place, à emporter ou livré autour de Kouba et Chéraga. Le rayon est volontairement court : au-delà, ce n'est plus le même plat qui arrive.",
  },
];

const FIGURES = [
  { value: "2", label: "adresses à Alger" },
  { value: "7j/7", label: "ouvert, le vendredi dès 18h" },
  { value: `${INSTAGRAM_FOLLOWERS}+`, label: "abonnés sur Instagram" },
  { value: "100%", label: "fait maison" },
];

export default function AProposPage() {
  return (
    <>
      <FixedBackground />

      {/* relative z-10 obligatoire : FixedBackground est en z-0, donc
          positionné, donc peint APRÈS les fonds des éléments non positionnés.
          Sans cette remontée, toute la page passerait derrière le motif. */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        <PageHero
          eyebrow="Notre histoire"
          title={
            <>
              Notre carte se lit
              <br className="hidden sm:block" />{" "}
              <span className="text-primary">comme un garage</span>
            </>
          }
          lead="Niwa Food est un fast-food fait maison, né à Kouba et installé depuis à Chéraga. Notre spécialité tient en deux mots : le burger artisanal."
        />

        {/* ---------- La vidéo et le récit ---------- */}
        <section className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Pas de bouton play/pause ici, contrairement à la section de
              l'accueil : muette et en boucle, cette vidéo est une ambiance, pas
              un contenu à consulter. Sans contrôle, la page reste un Server
              Component — zéro JavaScript envoyé pour l'afficher. */}
          <div className="overflow-hidden rounded-[2rem] border border-primary/30 bg-primary/10 shadow-[0_0_30px_-10px_rgba(217,169,77,0.7)]">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src="/niwa-video.mp4"
              poster="/niwa-video-poster.webp"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              className="aspect-square h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-2xl font-bold leading-tight text-accent-green sm:text-3xl">
              Tout part d&apos;une idée simple
            </h2>
            <p className="leading-relaxed text-foreground/75">
              Préparer chaque burger, chaque tacos et chaque pizza comme
              s&apos;il était le premier de la journée. Rien n&apos;est monté à
              l&apos;avance pour être réchauffé plus tard : quand vous
              commandez, on commence.
            </p>
            <p className="leading-relaxed text-foreground/75">
              Le reste, c&apos;est une question de tempérament. On aime les
              deux-roues, alors nos plats en portent les noms. Un TMAX, un
              MALOSSI, une VESPA — pas pour faire joli, mais parce que
              c&apos;est le vocabulaire de la maison, et que nos habitués
              commandent désormais par plaque plutôt que par ingrédient.
            </p>
          </div>
        </section>

        {/* ---------- Le décodeur : l'élément signature ---------- */}
        <section className="mt-16">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
              Le décodeur
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              D&apos;où viennent les noms
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/75">
              Chaque plat rend hommage à une référence de l&apos;univers du
              scooter et de la moto. Voici la traduction.
            </p>
          </div>

          {/* Chaque entrée est dessinée comme une plaque : filet doré, nom en
              capitales, chasse fixe pour l'aligner d'une case à l'autre. La
              référence à l'atelier est portée par la FORME, pas par une icône
              de clé à molette posée dessus. */}
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {GARAGE_NAMES.map((entry) => (
              <li
                key={entry.name}
                className="flex flex-col gap-1 rounded-xl border border-primary/25 bg-background/60 px-3.5 py-3 backdrop-blur-sm transition-colors hover:border-primary/60 dark:bg-primary/10"
              >
                <span className="font-heading text-base font-bold tracking-wider text-primary">
                  {entry.name}
                </span>
                <span className="text-xs leading-snug text-foreground/75">
                  {entry.meaning}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- La méthode ---------- */}
        <section className="mt-16">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
              En cuisine
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Ce qu&apos;on refuse de faire
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {METHOD.map((point) => (
              <article
                key={point.title}
                className="flex gap-4 rounded-2xl border border-primary/25 bg-background/60 p-5 backdrop-blur-sm dark:bg-primary/10"
              >
                <span
                  aria-hidden="true"
                  className={`${point.icon} shrink-0 text-3xl text-accent-green`}
                />
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {point.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/70">
                    {point.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Chiffres ---------- */}
        <section className="mt-16 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {FIGURES.map((figure) => (
            <div
              key={figure.label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-primary/25 bg-background/60 px-3 py-5 text-center backdrop-blur-sm dark:bg-primary/10"
            >
              <p className="font-heading text-2xl font-bold text-accent-green sm:text-3xl">
                {figure.value}
              </p>
              <p className="text-xs font-semibold leading-tight text-foreground/75">
                {figure.label}
              </p>
            </div>
          ))}
        </section>

        {/* ---------- Sortie ---------- */}
        <section className="mt-16 flex flex-col items-center gap-4 rounded-[2rem] border border-primary bg-background/70 px-6 py-10 text-center shadow-[0_0_30px_-8px_rgba(217,169,77,0.7)] backdrop-blur-md dark:bg-primary/15">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Le reste se goûte
          </h2>
          <p className="max-w-md text-sm text-foreground/70">
            Composez votre commande en quelques minutes, sur place, à emporter
            ou en livraison.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/commande"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-heading font-bold text-on-primary transition-all duration-300 hover:bg-accent-slate motion-safe:hover:scale-105"
            >
              Voir la carte
              <span
                aria-hidden="true"
                className="icon-[line-md--arrow-right-circle-twotone] text-xl"
              />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-heading font-bold text-foreground transition-colors hover:bg-primary/10"
            >
              Nos adresses
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
