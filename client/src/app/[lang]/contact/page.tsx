import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { FixedBackground } from "@/components/public/FixedBackground";
import { PageHero } from "@/components/public/PageHero";
import { StoreCard } from "@/components/public/StoreCard";
import {
  OPENING_HOURS,
  SOCIALS,
  STORE_LOCATIONS,
  formatHourRange,
} from "@/config/locations";
import { hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { fill } from "@/i18n/text";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { contactPage } = getDictionary(lang);

  // Même raison que dans a-propos : sans elle, l'aperçu perdrait son image.
  const parentImages = (await parent).openGraph?.images ?? [];

  return {
    title: contactPage.metaTitle,
    description: contactPage.metaDescription,
    openGraph: {
      title: contactPage.metaTitle,
      description: contactPage.ogDescription,
      images: parentImages,
    },
  };
}

// Une icône par mode de service, dans l'ordre de dict.contactPage.modes.
const SERVICE_MODE_ICONS = [
  "icon-[mdi--silverware-fork-knife]",
  "icon-[mdi--bag-checked]",
  "icon-[mdi--moped]",
];

export default async function ContactPage({ params }: PageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const page = dict.contactPage;

  return (
    <>
      <FixedBackground />

      {/* relative z-10 obligatoire : FixedBackground est en z-0, donc
          positionné, donc peint APRÈS les fonds des éléments non positionnés. */}
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

        {/* ---------- Les adresses ---------- */}
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {STORE_LOCATIONS.map((location) => (
            <StoreCard
              key={location.slug}
              location={location}
              locale={lang}
              dict={dict}
            />
          ))}
        </section>

        {/* ---------- Horaires, en grand ----------
            Répétés ici alors qu'ils figurent déjà sur chaque carte : c'est LA
            question qu'on pose à un fast-food à 23h, elle mérite d'être
            lisible sans avoir à choisir une adresse d'abord. */}
        <section className="mt-6 flex flex-col gap-5 rounded-3xl border border-primary/30 bg-background/70 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:bg-primary/10">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="icon-[mdi--clock-outline] text-3xl text-accent-mustard"
            />
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                {page.hoursTitle}
              </h2>
              <p className="text-sm text-foreground/75">{page.hoursNote}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:text-end">
            {OPENING_HOURS.map((slot) => (
              <div
                key={slot.days}
                className="flex items-baseline justify-between gap-6 sm:justify-end"
              >
                <span className="text-sm text-foreground/70">
                  {dict.hours[slot.days]}
                </span>
                <span
                  dir="ltr"
                  className="tabular-nums font-heading text-base font-bold text-accent-green"
                >
                  {formatHourRange(slot, lang)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Modes de service ---------- */}
        <section className="mt-16">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
              {page.howEyebrow}
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {page.howTitle}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {page.modes.map((mode, index) => (
              <article
                key={mode.title}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-primary/25 bg-background/60 p-5 text-center backdrop-blur-sm dark:bg-primary/10"
              >
                <span
                  aria-hidden="true"
                  className={`${SERVICE_MODE_ICONS[index]} text-3xl text-accent-green`}
                />
                <h3 className="font-heading text-base font-bold text-foreground">
                  {mode.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {mode.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Réseaux ----------
            Pas de formulaire de contact : il n'existe aucune route côté
            serveur pour recevoir un message, et un champ qui n'envoie nulle
            part est pire qu'une absence de champ. Les vraies voies de contact
            d'un fast-food sont le téléphone et les messages privés. */}
        <section className="mt-16 flex flex-col items-center gap-4 rounded-4xl border border-primary bg-background/70 px-6 py-10 text-center shadow-[0_0_30px_-8px_rgba(217,169,77,0.7)] backdrop-blur-md dark:bg-primary/15">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {page.questionTitle}
          </h2>
          <p className="max-w-md text-sm text-foreground/70">
            {page.questionText}
          </p>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
            {SOCIALS.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={fill(dict.socialLabel, { network: social.name })}
                className={`flex h-12 items-center gap-2 rounded-full px-5 font-heading text-sm font-bold transition-transform duration-300 motion-safe:hover:scale-105 ${social.bg} ${social.text}`}
              >
                <span
                  aria-hidden="true"
                  className={`${social.icon} ${social.fg} text-xl`}
                />
                {social.name}
              </Link>
            ))}
          </div>

          <Link
            href={localizePath(lang, "/commande")}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-heading font-bold text-on-primary transition-all duration-300 hover:bg-accent-slate motion-safe:hover:scale-105"
          >
            {page.placeOrder}
            <span
              aria-hidden="true"
              className="icon-[line-md--arrow-right-circle-twotone] text-xl rtl:-scale-x-100"
            />
          </Link>
        </section>
      </div>
    </>
  );
}
