// page.tsx

import { About } from "@/components/public/About";
import { BestSellers } from "@/components/public/BestSellers";
import { Contact } from "@/components/public/Contact";
import { Hero } from "@/components/public/Hero";
import { HowItWorks } from "@/components/public/HowItWorks";
import { RestaurantJsonLd } from "@/components/public/RestaurantJsonLd";
import { StreetBands } from "@/components/public/StreetBands";
import { Testimonials } from "@/components/public/Testimonials";

/**
 * Accueil « street-food pop ».
 *
 * Un seul moment orchestré, au chargement : le titre s'empile, le burger
 * tombe sur l'assiette, les éclats de terrazzo jaillissent (Hero). Plus bas,
 * rien ne s'anime tout seul en entrant dans l'écran : chaque effet répond à
 * un geste du visiteur, le défilement (bandeaux, route, vidéo) ou la souris
 * (cartes, reflets).
 */
export default function Home() {
  return (
    <>
      <RestaurantJsonLd />

      <Hero />
      <StreetBands />

      <div className="flex flex-col gap-24 pb-24 pt-10 sm:gap-32 sm:pb-32">
        <BestSellers />
        <HowItWorks />
        <About />
        <Testimonials />
        <Contact />
      </div>
    </>
  );
}
