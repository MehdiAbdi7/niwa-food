/**
 * Fond de page immobile, repris du hero.
 *
 * position:fixed plutôt que `background-attachment: fixed` : cette propriété
 * est saccadée sur Android et purement ignorée par Safari iOS, où le fond
 * défilerait quand même. Un élément fixe couvrant le viewport donne le même
 * rendu partout, sans repeindre à chaque frame de scroll.
 *
 * z-0 et non -z-10 : le wrapper du layout public porte un `bg-background`
 * opaque. Les fonds des blocs non positionnés sont peints APRÈS les couches
 * z-index négatives, donc un -z-10 disparaîtrait derrière. En z-0 l'élément
 * est positionné, donc peint plus tard — d'où l'obligation de remonter le
 * contenu de la page en `relative z-10`.
 *
 * La classe `.background` (globals.css) apporte l'image, qui suit déjà le
 * thème clair/sombre via --hero-bg-image.
 */
export function FixedBackground() {
  return (
    <div
      aria-hidden="true"
      className="background pointer-events-none fixed inset-0 z-0"
    >
      {/* Voile : la carte est un écran de lecture dense, pas une page
          d'accueil. Sans lui, le motif passe derrière chaque description de
          plat et fatigue à la lecture. Ajuster l'opacité si besoin. */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
}
