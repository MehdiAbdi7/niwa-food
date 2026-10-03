import Image from "next/image";
import Link from "next/link";
// Adresses, horaires et réseaux viennent de la source unique : cette section
// en gardait sa propre copie, qui avait fini par écrire les horaires
// autrement que la page Contact (« Lun – Jeu, Sam – Dim » contre « Samedi à
// jeudi »).
import {
  OPENING_HOURS,
  SOCIALS,
  STORE_LOCATIONS,
} from "@/config/locations";

// Largeur d'AFFICHAGE de la photo, pas le poids du fichier : le navigateur
// choisit la variante du srcset avec cette seule information, avant même
// d'avoir appliqué le CSS. Suit le max-w-4xl de la grille : une colonne
// pleine sous md, ~430 px par carte au-delà.
const FACADE_SIZES = "(max-width: 768px) 100vw, 440px";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden px-2 sm:px-4 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl rounded-4xl shadow-[0_0_25px_5px_rgba(217,169,77,0.45)] shadow-primary/30 backdrop-blur-md px-6 sm:px-2 py-6 background dark:bg-primary/30 border border-primary">
        <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
          <span className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-foreground/70">
            Venez nous voir
          </span>
          <h2 className="font-heading text-3xl font-bold text-accent-green sm:text-4xl">
            Deux adresses, un seul régal
          </h2>
          <p className="max-w-md text-sm text-foreground/80">
            Deux cuisines, la même exigence de fraîcheur et de générosité.
          </p>
        </div>

        {/* max-w-4xl et non la pleine largeur du bloc : en aspect ratio, la
            hauteur de la photo suit sa largeur. Contenir la grille est le
            levier le plus efficace pour alléger les cartes, sans toucher au
            cadre doré de la section, qui reste large comme les autres. */}
        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
          {STORE_LOCATIONS.map((location) => (
            // overflow-hidden + padding porté par le bloc de texte, et non par
            // la carte : c'est ce qui permet à la photo d'aller bord à bord
            // tout en respectant l'arrondi.
            <article
              key={location.name}
              className="group flex flex-col overflow-hidden rounded-3xl border border-primary bg-background shadow-food-sm"
            >
              {/* 3/2 plutôt que 4/3 : format plus panoramique, donc ~60 px de
                  hauteur gagnés par carte. Une devanture se lit très bien en
                  bandeau — c'est un objet large, pas un portrait. */}
              <div className="relative aspect-3/2 w-full shrink-0 overflow-hidden bg-primary/10">
                <Image
                  src={location.image}
                  alt={`Devanture du restaurant Niwa Food de ${location.name}`}
                  fill
                  sizes={FACADE_SIZES}
                  className={`object-cover ${location.imagePosition} transition-transform duration-500 motion-safe:group-hover:scale-105`}
                />

                {/* Dégradé et non voile uniforme : le nom reste lisible sans
                    ternir la façade, qui est l'intérêt de la photo. */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-4">
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--map-marker] text-xl text-accent-mustard"
                  />
                  <h3 className="font-heading text-xl font-bold text-white">
                    {location.name}
                  </h3>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <p className="text-sm text-accent-green">
                  {location.addressDetail
                    ? `${location.address}, ${location.addressDetail}`
                    : location.address}
                </p>

                <a
                  href={location.phoneHref}
                  className="flex items-center gap-2 font-semibold text-foreground hover:underline"
                >
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--phone] text-lg"
                  />
                  {location.phone}
                </a>

                {/* mt-auto : les horaires s'ancrent en bas, donc alignés d'une
                    carte à l'autre même si une adresse tient sur deux lignes. */}
                <div className="mt-auto flex items-start gap-2 pt-1 text-xs text-accent-green">
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--clock-outline] mt-0.5 text-base"
                  />
                  <div className="leading-relaxed">
                    {OPENING_HOURS.map((slot) => (
                      <p key={slot.days}>
                        {slot.days} : {slot.hours}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Le geste attendu après avoir vu une façade : y aller.
                    44 px de haut, la cible tactile minimale — c'est le plancher
                    à ne pas franchir en compactant. */}
                <Link
                  href={location.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Itinéraire vers Niwa Food ${location.name} sur Google Maps`}
                  className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full border border-primary font-heading text-sm font-bold text-foreground transition-all duration-300 ease-in-out hover:bg-primary hover:text-background"
                >
                  <span
                    aria-hidden="true"
                    className="icon-[mdi--directions] text-base"
                  />
                  Itinéraire
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-primary/20 pt-6">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-foreground/70">
            Suivez l&apos;aventure
          </p>

          <div className="flex items-center justify-center gap-2">
            {SOCIALS.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 ${social.bg}`}
              >
                <span
                  aria-hidden="true"
                  className={`${social.icon} ${social.fg} text-2xl`}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
