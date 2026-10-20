import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/getDictionary";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";

// Les images seules : leur texte (alt, légende) vient du dictionnaire, dans
// le même ordre (hero.slides).
const HERO_IMAGES = [
  "/hero-burger1.png",
  "/tacos-gilera.png",
  "/hero-pizza.png",
  "/frites.png",
  "/salade.png",
];

// Une ligne par étage : le titre s'empile comme un burger au chargement
// (keyframes hero-line-land, globals.css). L'inclinaison de départ alterne
// pour que chaque étage ait l'air posé à la main. Le texte de chaque étage
// vient du dictionnaire (hero.headline).
const HEADLINE_TILTS = ["-6deg", "5deg", "-4deg", "3deg"];

interface HeroProps {
  locale: Locale;
  dict: Dictionary;
}

export function Hero({ locale, dict }: HeroProps) {
  const slides: HeroSlide[] = HERO_IMAGES.map((src, index) => ({
    src,
    ...dict.hero.slides[index],
  }));

  return (
    // Fond d'origine du site (.background, image claire ou sombre selon le
    // thème) sous le header transparent.
    //
    // Marge haute FIXE, et non calculée sur --header-height : à 360 px, le
    // bandeau démo passe sur deux lignes à l'arrivée de la police DM Sans,
    // le header grandit de 16 px, et tout le hero descendait d'autant pendant
    // le chargement. 136 px laissent de la place même au header le plus haut
    // (114 px).
    <section className="background relative isolate overflow-hidden px-5 pt-34 text-foreground sm:px-8 lg:pt-40">
      {/* Fondu vers la couleur de fond : l'image du hero s'efface au lieu de
          s'arrêter net sur les bandeaux et les sections, qui sont sur fond
          uni. Sous le contenu (z-10), il ne touche que l'image. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-linear-to-b from-transparent to-background"
      />

      {/* Padding bas plus grand que le haut : les bandeaux de StreetBands
          viennent chevaucher le bas du hero. */}
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 pb-20 md:grid-cols-[1.1fr_1fr] md:gap-4 lg:pb-38">
        <div className="flex flex-col items-start gap-6">
          {/* rtl:leading-[1.15] : l'arabe porte des signes au-dessus des
              lettres (تُحضَّر), qu'un interligne de 0.9 collait à la ligne
              du dessus. */}
          <h1 className="font-heading text-[clamp(2.5rem,11.5vw,3.9rem)] font-bold leading-[0.9] tracking-[-0.02em] md:text-[clamp(3.1rem,5.6vw,4.75rem)] rtl:leading-[1.15]">
            {/* L'espace après chaque ligne ne se voit pas (les lignes sont
                des blocs) mais il compte pour le texte brut : sans lui,
                Google et le presse-papiers liraient « tacoset pizzas ». */}
            {dict.hero.headline.map((line, index) => (
              <Fragment key={line}>
                <span
                  className="hero-line"
                  style={
                    {
                      "--i": index,
                      "--tilt": HEADLINE_TILTS[index],
                    } as CSSProperties
                  }
                >
                  {line}
                </span>{" "}
              </Fragment>
            ))}
          </h1>

          <p className="max-w-md text-base font-semibold leading-relaxed sm:text-lg">
            {dict.hero.lead}
          </p>

          {/* En colonne sur mobile, toujours, et pas de flex-wrap : la
              police de secours, plus large que Baloo 2, faisait passer le
              lien à la ligne le temps du chargement, puis il remontait.
              Toute la suite du hero sautait de 44 px (CLS 0,13). */}
          <div className="flex flex-col items-start gap-5 pb-2 sm:flex-row sm:items-center sm:gap-7">
            {/* Couleurs du bouton d'origine (primary, primary-dark en
                sombre) : 4,85:1 en clair, 5,6:1 en sombre. */}
            <Link
              href={localizePath(locale, "/commande")}
              className="btn-press inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-lg font-bold text-background [--edge:#5e3a2e] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-foreground dark:bg-primary-dark dark:text-foreground dark:[--edge:#3f2c03]"
            >
              {dict.common.order}
              {/* rtl:-scale-x-100 : en arabe, la flèche « vers l'avant »
                  pointe à gauche, dans le sens de lecture. */}
              <span
                aria-hidden="true"
                className="icon-[line-md--arrow-right-circle-twotone] text-2xl rtl:-scale-x-100"
              />
            </Link>
            <Link
              href="#contact"
              className="font-heading text-lg font-bold underline decoration-2 underline-offset-4 transition-[text-decoration-thickness] hover:decoration-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {dict.hero.addresses}
            </Link>
          </div>
        </div>

        <HeroCarousel slides={slides} />
      </div>
    </section>
  );
}
