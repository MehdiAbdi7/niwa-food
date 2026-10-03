interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
}

/**
 * En-tête des pages secondaires (À propos, Contact).
 *
 * Volontairement plus sobre que le Hero de l'accueil : celui-ci doit vendre,
 * celui-là doit situer. Pas de photo, pas de carrousel — le client qui arrive
 * ici cherche une information précise, on la lui sert sans l'obliger à
 * traverser une mise en scène.
 *
 * Le surtitre en vert reprend la grammaire des sections de l'accueil, pour que
 * ces pages se lisent comme la suite du même site et non comme une annexe.
 */
export function PageHero({ eyebrow, title, lead }: PageHeroProps) {
  return (
    <header className="flex flex-col gap-3 text-center sm:text-left">
      <span className="font-heading text-sm font-bold uppercase tracking-wide text-accent-green">
        {eyebrow}
      </span>

      <h1 className="font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h1>

      {lead && (
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-foreground/70 sm:mx-0 sm:text-lg">
          {lead}
        </p>
      )}

      <span
        aria-hidden="true"
        className="mx-auto mt-2 h-1 w-24 rounded-full bg-linear-to-r from-primary to-transparent sm:mx-0"
      />
    </header>
  );
}
