import Image from "next/image";
import Link from "next/link";
import { OPENING_HOURS, type StoreLocation } from "@/config/locations";

// Largeur d'AFFICHAGE de la photo, pas le poids du fichier : le navigateur
// choisit la variante du srcset avec cette seule information, avant même
// d'avoir appliqué le CSS. Une colonne pleine sous md, ~500px par carte au-delà.
const FACADE_SIZES = "(max-width: 768px) 100vw, 500px";

/**
 * Une adresse, en entier.
 *
 * Plus détaillée que la carte de la section d'accueil : ici le client est venu
 * pour appeler ou pour venir, donc le téléphone et l'itinéraire sont des
 * boutons pleine largeur de 48px, pas des liens de texte. Les horaires sont
 * répétés sur chaque adresse plutôt que renvoyés en bas de page — personne ne
 * doit avoir à faire l'aller-retour pour savoir si c'est ouvert.
 */
export function StoreCard({ location }: { location: StoreLocation }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-primary/30 bg-background/70 shadow-[0_0_25px_-10px_rgba(217,169,77,0.6)] backdrop-blur-md dark:bg-primary/10">
      {/* 3/2 plutôt que 4/3 : une devanture est un objet large, elle se lit
          très bien en bandeau et la carte reste compacte. */}
      <div className="relative aspect-3/2 w-full shrink-0 overflow-hidden bg-primary/10">
        <Image
          src={location.image}
          alt={`Devanture du restaurant Niwa Food de ${location.name}`}
          fill
          sizes={FACADE_SIZES}
          className={`object-cover ${location.imagePosition} transition-transform duration-500 motion-safe:group-hover:scale-105`}
        />

        {/* Dégradé et non voile uniforme : le nom reste lisible sans ternir la
            façade, qui est tout l'intérêt de la photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="icon-[mdi--map-marker] text-xl text-accent-mustard"
            />
            <h2 className="font-heading text-2xl font-bold text-white">
              {location.name}
            </h2>
          </div>
          <p className="text-right text-xs font-semibold text-white/75">
            {location.address}
            {location.addressDetail && (
              <>
                <br />
                {location.addressDetail}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Le téléphone est LA voie de contact d'un fast-food de quartier :
            il mérite un bouton, pas une ligne de texte. */}
        <a
          href={location.phoneHref}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-heading text-base font-bold text-on-primary transition-all duration-300 hover:bg-accent-slate motion-safe:hover:scale-[1.02]"
        >
          <span aria-hidden="true" className="icon-[mdi--phone] text-lg" />
          {location.phone}
        </a>

        <div className="flex flex-col gap-2 rounded-2xl bg-primary/5 px-4 py-3">
          <p className="flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wide text-foreground/75">
            <span aria-hidden="true" className="icon-[mdi--clock-outline] text-sm" />
            Horaires
          </p>
          {OPENING_HOURS.map((slot) => (
            <div
              key={slot.days}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-foreground/70">{slot.days}</span>
              <span className="tabular-nums font-semibold text-accent-green">
                {slot.hours}
              </span>
            </div>
          ))}
        </div>

        {/* mt-auto : l'itinéraire s'ancre en bas, donc aligné d'une carte à
            l'autre même si une adresse tient sur deux lignes. */}
        <Link
          href={location.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Voir l'itinéraire vers Niwa Food ${location.name} sur Google Maps`}
          className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full border border-primary font-heading text-sm font-bold text-foreground transition-all duration-300 hover:bg-primary hover:text-background"
        >
          <span aria-hidden="true" className="icon-[mdi--directions] text-base" />
          Voir l&apos;itinéraire
        </Link>
      </div>
    </article>
  );
}
