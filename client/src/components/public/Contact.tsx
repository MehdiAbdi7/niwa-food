"use client";

import Image from "next/image";
import Link from "next/link";
import { spotlightOnPointerMove } from "@/features/motion/pointerEffects";
// Adresses, horaires et réseaux viennent de la source unique : cette section
// en gardait sa propre copie, qui avait fini par écrire les horaires
// autrement que la page Contact (« Lun – Jeu, Sam – Dim » contre « Samedi à
// jeudi »).
import { OPENING_HOURS, SOCIALS, STORE_LOCATIONS } from "@/config/locations";

// Largeur d'AFFICHAGE de la photo, pas le poids du fichier : le navigateur
// choisit la variante du srcset avec cette seule information, avant même
// d'avoir appliqué le CSS. Une colonne pleine sous md, ~560 px par carte
// au-delà dans le max-w-6xl.
const FACADE_SIZES = "(max-width: 768px) 100vw, 560px";

export function Contact() {
  return (
    // scroll-mt : le lien « Nos deux adresses » du hero amène ici, et sans
    // marge le titre atterrirait sous le header fixe.
    <section id="contact" className="scroll-mt-(--sticky-top) px-4 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.01em] text-foreground sm:text-6xl">
          Deux adresses à Alger
        </h2>
        <p className="mt-3 max-w-md text-base text-foreground/75 sm:text-lg">
          Même carte, mêmes horaires, deux cuisines.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {STORE_LOCATIONS.map((location) => (
            // overflow-hidden + padding porté par le bloc de texte, et non par
            // la carte : c'est ce qui permet à la photo d'aller bord à bord
            // tout en respectant l'arrondi. .spotlight (globals.css) dessine
            // le reflet qui suit la souris.
            <article
              key={location.name}
              onPointerMove={spotlightOnPointerMove}
              className="spotlight group relative flex flex-col overflow-hidden rounded-[2rem] bg-surface shadow-[0_24px_40px_-30px_rgb(61_39_22/0.7)] ring-1 ring-border-subtle"
            >
              <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-primary/10">
                <Image
                  src={location.image}
                  alt={`Devanture du restaurant Niwa Food de ${location.name}`}
                  fill
                  sizes={FACADE_SIZES}
                  className={`object-cover ${location.imagePosition} transition-transform duration-700 motion-safe:group-hover:scale-105`}
                />

                {/* Dégradé et non voile uniforme : le nom reste lisible sans
                    ternir la façade, qui est l'intérêt de la photo. */}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />

                <h3 className="absolute bottom-4 left-5 font-heading text-4xl font-bold leading-none text-white sm:text-5xl">
                  {location.name}
                </h3>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                <p className="flex items-start gap-1.5 text-base text-foreground/80">
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--map-marker] mt-0.5 shrink-0 text-lg text-primary"
                  />
                  {location.addressDetail
                    ? `${location.address}, ${location.addressDetail}`
                    : location.address}
                </p>

                {/* Le téléphone est LA voie de contact d'un fast-food de
                    quartier : il mérite un bouton, pas une ligne de texte. */}
                <a
                  href={location.phoneHref}
                  className="btn-press flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-heading text-lg font-bold text-on-primary [--edge:#5e3a2e] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent-green dark:[--edge:#6b4b05]"
                >
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--phone] text-xl"
                  />
                  {location.phone}
                </a>

                <div className="flex flex-col gap-1.5 text-sm">
                  {OPENING_HOURS.map((slot) => (
                    <div
                      key={slot.days}
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-border-subtle pb-1.5 last:border-none"
                    >
                      <span className="text-foreground/75">{slot.days}</span>
                      <span className="tabular-nums font-semibold text-foreground">
                        {slot.hours}
                      </span>
                    </div>
                  ))}
                </div>

                {/* mt-auto : l'itinéraire s'ancre en bas, donc aligné d'une
                    carte à l'autre même si une adresse tient sur deux lignes.
                    44 px de haut minimum, la cible tactile recommandée. */}
                <Link
                  href={location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Itinéraire vers Niwa Food ${location.name} sur Google Maps`}
                  className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full border-2 border-foreground font-heading text-base font-bold text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
                >
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--directions] text-lg"
                  />
                  Itinéraire
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
