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

export function Hero() {
  return (
    <section className="background relative isolate overflow-hidden px-4 py-14 sm:px-2 sm:py-16">
      {/* Contenu */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-10 pt-20 pb-10 md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-8 md:px-4 lg:gap-20 lg:px-6">
        <div className="order-2 w-full md:order-2 md:translate-x-3 lg:translate-x-12">
          <HeroCarousel slides={heroSlides} />
        </div>

        <div className="order-1 flex flex-col items-center justify-between md:order-1 md:items-start">
          {/* Texte avec stagger */}
          <div className="flex max-w-2xl flex-col items-center gap-5 text-center md:items-start md:text-left">
            <span className="animate-[slideInLeft_0.6s_ease-out_0.1s_both] font-heading text-md md:text-lg font-bold uppercase tracking-wide text-accent-green">
              Fast-food fait maison
            </span>

            <h1 className="animate-[slideInLeft_0.6s_ease-out_0.2s_both] font-heading text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
              Commandez vos
              <br /> <span className="text-primary">plats préférés</span>
              <br /> en toute simplicité
            </h1>

            <p className="animate-[slideInLeft_0.6s_ease-out_0.3s_both] mx-auto max-w-lg font-semibold leading-relaxed text-foreground md:mx-0">
              <span className="text-lg  text-accent-green">
                Tacos, pizzas, burgers et salades{" "}
              </span>
              préparés minute, 100% faits maison. Sur place, à emporter, ou
              livrés directement chez vous.
            </p>

            <Link
              href="/commande"
              className="animate-[slideInLeft_0.6s_ease-out_0.4s_both] my-4 inline-flex w-fit items-center gap-3 rounded-full bg-primary px-5 py-3 font-bold text-background transition-all duration-300 ease-in-out hover:scale-105 hover:bg-accent-slate dark:bg-primary-dark dark:text-foreground"
            >
              Passer votre commande
              <span className="icon-[line-md--arrow-right-circle-twotone] text-2xl" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
