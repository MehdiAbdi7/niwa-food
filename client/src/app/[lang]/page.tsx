// page.tsx

import Image from "next/image";
import { notFound } from "next/navigation";
import { About } from "@/components/public/About";
import { BestSellers } from "@/components/public/BestSellers";
import { Contact } from "@/components/public/Contact";
import { Hero } from "@/components/public/Hero";
import { HowItWorks } from "@/components/public/HowItWorks";
import { RestaurantJsonLd } from "@/components/public/RestaurantJsonLd";
import { StreetBands } from "@/components/public/StreetBands";
import { Testimonials } from "@/components/public/Testimonials";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";

// Toutes les décorations ci-dessous vivent dans un cadre `w-56` visible à
// partir de xl uniquement : leur largeur d'affichage est donc constante, d'où
// un `sizes` fixe. Sans lui, Next suppose 100vw et sert la variante la plus
// large du srcset pour un rendu de 224 px.
const DECO_SIZES = "224px";

interface SideDecoProps {
  src: string;
  /** Marge de gauche ou de droite. */
  side: "left" | "right";
  /** Position verticale, hauteur et éventuel retournement du cadre. */
  className: string;
  imageClassName: string;
}

/**
 * Décoration des marges (sauces, ingrédients), accrochée à une section.
 *
 * Collée au bord EXTÉRIEUR de la colonne de contenu (max-w-6xl), jamais
 * dedans : les titres et les textes de l'accueil commencent au ras de cette
 * colonne, une décoration posée par-dessus les masquait. Sur un écran de
 * 1366 px elle dépasse à moitié de la marge, sur un écran large elle s'y
 * voit en entier ; ce qui sort de l'écran est coupé par l'overflow-x-clip
 * de la page.
 *
 * Pas de `priority` : ces images sont purement ornementales et masquées sous
 * xl. Les précharger volait la priorité de la photo du hero, qui est le vrai
 * contenu de la page. Masquées (display: none) sous xl, elles ne sont même
 * pas téléchargées sur téléphone : next/image les charge en lazy.
 */
function SideDeco({ src, side, className, imageClassName }: SideDecoProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 hidden xl:block"
    >
      <div className="relative mx-auto h-full max-w-6xl">
        <div
          className={`absolute w-56 ${side === "left" ? "right-full" : "left-full"} ${className}`}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={DECO_SIZES}
            className={imageClassName}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Accueil « street-food pop ».
 *
 * Un seul moment orchestré, au chargement : le titre s'empile, le burger
 * tombe dans le cercle, les éclats de terrazzo jaillissent (Hero). Plus bas,
 * rien ne s'anime tout seul en entrant dans l'écran : chaque effet répond à
 * un geste du visiteur, le défilement (bandeaux, route, vidéo) ou la souris
 * (cartes, reflets).
 *
 * Chaque décoration est accrochée à la section qu'elle borde (un parent
 * `relative`), et non posée entre deux sections : un élément de plus dans
 * la colonne flex ajouterait un espace (gap) de plus.
 *
 * Seul Hero reçoit ses textes en props : c'est le seul composant serveur de
 * la page. Les autres sont des composants client, ils les lisent avec
 * useI18n().
 */
export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  // Même vérification sur chaque page publique : /dashboard/xyz arrive dans
  // app/[lang] avec lang = "dashboard", c'est ici qu'il devient un 404.
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <>
      <RestaurantJsonLd />

      <Hero locale={lang} dict={getDictionary(lang)} />
      <StreetBands />

      <div className="flex flex-col gap-24 pb-24 pt-10 sm:gap-32 sm:pb-32">
        <div className="relative">
          <SideDeco
            src="/sauces.png"
            side="left"
            className="top-[58%] h-112 -translate-y-1/2"
            imageClassName="rounded-2xl object-cover object-center"
          />
          <SideDeco
            src="/sauces2.png"
            side="right"
            className="top-[58%] h-112 -translate-y-1/2 -scale-x-100"
            imageClassName="rounded-2xl object-cover object-center"
          />
          <BestSellers />
        </div>

        <div className="relative">
          <SideDeco
            src="/deco.png"
            side="right"
            className="top-1/2 h-240 -translate-y-1/2"
            imageClassName="object-contain object-center"
          />
          <HowItWorks />
        </div>

        <About />

        <div className="relative">
          <SideDeco
            src="/deco.png"
            side="left"
            className="top-0 h-240 -translate-y-1/2"
            imageClassName="object-contain object-center"
          />
          <Testimonials />
        </div>

        <div className="relative">
          <SideDeco
            src="/sauces.png"
            side="left"
            className="top-[58%] h-112 -translate-y-1/2"
            imageClassName="rounded-2xl object-cover object-center"
          />
          <SideDeco
            src="/sauces2.png"
            side="right"
            className="top-[58%] h-112 -translate-y-1/2 -scale-x-100"
            imageClassName="rounded-2xl object-cover object-center"
          />
          <Contact />
        </div>
      </div>
    </>
  );
}
