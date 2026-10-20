import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { FixedBackground } from "@/components/public/FixedBackground";
import { PageHero } from "@/components/public/PageHero";
import { INSTAGRAM_FOLLOWERS } from "@/config/locations";
import { NUMBER_LOCALES, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { aboutPage } = getDictionary(lang);

  // Un openGraph défini ici REMPLACE celui du layout, image d'aperçu
  // comprise. On reprend donc l'image du layout (app/[lang]/opengraph-image.jpg).
  const parentImages = (await parent).openGraph?.images ?? [];

  return {
    title: aboutPage.metaTitle,
    description: aboutPage.metaDescription,
    openGraph: {
      title: aboutPage.metaTitle,
      description: aboutPage.ogDescription,
      images: parentImages,
    },
  };
}

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
 * change de nom ou sort de la carte. Les noms restent tels quels dans les
 * trois langues, leur explication est traduite (dict.aboutPage.garage).
 */
const GARAGE_NAMES = [
  "TMAX",
  "NMAX",
  "VESPA",
  "GILERA",
  "POLINI",
  "MALOSSI",
  "GIVI",
  "ARAI",
  "J-COSTA",
] as const;

// Une icône par point de méthode, dans l'ordre de dict.aboutPage.method.
const METHOD_ICONS = [
  "icon-[mdi--bread-slice-outline]",
  "icon-[mdi--water]",
  "icon-[mdi--fire]",
  "icon-[mdi--moped]",
];

export default async function AProposPage({ params }: PageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const page = dict.aboutPage;

  const figures = [
    { value: "2", label: page.figures.addresses },
    { value: page.figures.openValue, label: page.figures.open },
    {
      value: `${INSTAGRAM_FOLLOWERS.toLocaleString(NUMBER_LOCALES[lang])}+`,
      label: page.figures.followers,
    },
    { value: "100%", label: page.figures.homemade },
  ];

  return (
    <>
      <FixedBackground />

      {/* relative z-10 obligatoire : FixedBackground est en z-0, donc
          positionné, donc peint APRÈS les fonds des éléments non positionnés.
          Sans cette remontée, toute la page passerait derrière le motif. */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        <PageHero
          eyebrow={page.eyebrow}
          title={
            <>
              {page.titleStart}
              <br className="hidden sm:block" />{" "}
              <span className="text-primary">{page.titleHighlight}</span>
            </>
          }
          lead={page.lead}
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
              {page.storyTitle}
            </h2>
            {page.story.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-foreground/75">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* ---------- Le décodeur : l'élément signature ---------- */}
        <section className="mt-16">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
              {page.decoderEyebrow}
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {page.decoderTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground/75">
              {page.decoderLead}
            </p>
          </div>

          {/* Chaque entrée est dessinée comme une plaque : filet doré, nom en
              capitales, chasse fixe pour l'aligner d'une case à l'autre. La
              référence à l'atelier est portée par la FORME, pas par une icône
              de clé à molette posée dessus. */}
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {GARAGE_NAMES.map((name) => (
              <li
                key={name}
                className="flex flex-col gap-1 rounded-xl border border-primary/25 bg-background/60 px-3.5 py-3 backdrop-blur-sm transition-colors hover:border-primary/60 dark:bg-primary/10"
              >
                <span className="font-heading text-base font-bold tracking-wider text-primary">
                  {name}
                </span>
                <span className="text-xs leading-snug text-foreground/75">
                  {page.garage[name]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- La méthode ---------- */}
        <section className="mt-16">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
              {page.methodEyebrow}
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {page.methodTitle}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {page.method.map((point, index) => (
              <article
                key={point.title}
                className="flex gap-4 rounded-2xl border border-primary/25 bg-background/60 p-5 backdrop-blur-sm dark:bg-primary/10"
              >
                <span
                  aria-hidden="true"
                  className={`${METHOD_ICONS[index]} shrink-0 text-3xl text-accent-green`}
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
          {figures.map((figure) => (
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
            {page.ctaTitle}
          </h2>
          <p className="max-w-md text-sm text-foreground/70">{page.ctaText}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={localizePath(lang, "/commande")}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-heading font-bold text-on-primary transition-all duration-300 hover:bg-accent-slate motion-safe:hover:scale-105"
            >
              {dict.common.seeMenu}
              <span
                aria-hidden="true"
                className="icon-[line-md--arrow-right-circle-twotone] text-xl rtl:-scale-x-100"
              />
            </Link>
            <Link
              href={localizePath(lang, "/contact")}
              className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-heading font-bold text-foreground transition-colors hover:bg-primary/10"
            >
              {page.ctaAddresses}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
