import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { HeroCarousel, type HeroSlide } from "./HeroCarousel";

const heroSlides: HeroSlide[] = [
  {
    src: "/hero-burger1.png",
    alt: "Burger Niwa Food",
    label: "Burger juteux, pain toasté",
  },
  {
    src: "/tacos-gilera.png",
    alt: "Tacos Niwa Food",
    label: "Tacos généreux, sauce signature",
  },
  {
    src: "/hero-pizza.png",
    alt: "Pizza Niwa Food",
    label: "Pizza maison, pâte du jour",
  },
  {
    src: "/frites.png",
    alt: "Frites Niwa Food",
    label: "Frites croustillantes dorées",
  },
  {
    src: "/salade.png",
    alt: "Salade César Niwa Food",
    label: "Salade César, croquante et fraîche",
  },
];

// Une ligne par étage : le titre s'empile comme un burger au chargement
// (keyframes hero-line-land, globals.css). L'inclinaison de départ alterne
// pour que chaque étage ait l'air posé à la main.
const HEADLINE_LINES = [
  { text: "Burgers,", tilt: "-6deg" },
  { text: "tacos", tilt: "5deg" },
  { text: "et pizzas,", tilt: "-4deg" },
  { text: "faits minute.", tilt: "3deg" },
];

export function Hero() {
  return (
    // Le panneau commence sous le header fixe, mesuré par useHeightVar : le
    // header est transparent en haut de page, et le logo « FOOD » en
    // moutarde foncée ne serait pas lisible posé sur le panneau moutarde.
    <section className="px-3 pt-[calc(var(--header-height)+0.75rem)] sm:px-4">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-hero-panel text-hero-ink sm:rounded-[2.75rem]">
        {/* Padding bas plus grand que le haut : les bandeaux de StreetBands
            viennent chevaucher le bas du panneau. */}
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-10 sm:px-10 sm:pb-20 sm:pt-14 md:grid-cols-[1.1fr_1fr] md:gap-4 lg:px-12 lg:pb-24 lg:pt-16">
          <div className="flex flex-col items-start gap-6">
            <h1 className="font-heading text-[clamp(2.9rem,14vw,4.6rem)] font-bold leading-[0.88] tracking-[-0.02em] md:text-[clamp(3.6rem,7vw,5.75rem)]">
              {/* L'espace après chaque ligne ne se voit pas (les lignes sont
                  des blocs) mais il compte pour le texte brut : sans lui,
                  Google et le presse-papiers liraient « tacoset pizzas ». */}
              {HEADLINE_LINES.map((line, index) => (
                <Fragment key={line.text}>
                  <span
                    className="hero-line"
                    style={{ "--i": index, "--tilt": line.tilt } as CSSProperties}
                  >
                    {line.text}
                  </span>{" "}
                </Fragment>
              ))}
            </h1>

            <p className="max-w-md text-base font-semibold leading-relaxed sm:text-lg">
              Préparés à la commande dans nos cuisines de Kouba et Chéraga.
              Sur place, à emporter ou livrés chez vous.
            </p>

            {/* En colonne sur mobile, toujours, et pas de flex-wrap : la
                police de secours, plus large que Baloo 2, faisait passer le
                lien à la ligne le temps du chargement, puis il remontait.
                Toute la suite du hero sautait de 44 px (CLS 0,13). */}
            <div className="flex flex-col items-start gap-5 pb-2 sm:flex-row sm:items-center sm:gap-7">
              <Link
                href="/commande"
                className="btn-press rounded-full bg-hero-cta px-8 py-3.5 font-heading text-lg font-bold text-hero-cta-ink [--edge:var(--hero-cta-edge)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-hero-ink"
              >
                Commander
              </Link>
              <Link
                href="#contact"
                className="font-heading text-lg font-bold underline decoration-2 underline-offset-4 transition-[text-decoration-thickness] hover:decoration-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-hero-ink"
              >
                Nos deux adresses
              </Link>
            </div>
          </div>

          <HeroCarousel slides={heroSlides} />
        </div>
      </div>
    </section>
  );
}
