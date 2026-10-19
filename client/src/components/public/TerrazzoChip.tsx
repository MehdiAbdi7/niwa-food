/**
 * Un éclat de terrazzo, repris du motif qui entoure le logo Niwa.
 *
 * Six formes irrégulières tracées à la main dans un carré de 40 : assez
 * pour qu'aucun voisin ne paraisse identique, assez peu pour rester un
 * motif reconnaissable. Le composant ne fait que dessiner ; position, taille
 * et animation appartiennent à l'appelant.
 */
const SHAPES = [
  "M6 10 L28 4 L36 18 L24 34 L8 28 Z",
  "M4 20 C4 10 14 4 24 6 L36 14 L30 30 C22 36 10 34 4 20 Z",
  "M10 4 L34 10 L30 26 L12 36 L4 18 Z",
  "M2 14 L20 2 L38 12 L30 32 L10 30 Z",
  "M4 26 C10 12 24 4 36 6 C34 14 22 26 6 34 Z",
  "M8 6 L36 16 L14 34 Z",
];

interface TerrazzoChipProps {
  /** Index de la forme, pris modulo le nombre de formes. */
  shape: number;
  /** Couleur de remplissage, en général une variable --chip-*. */
  color: string;
  className?: string;
}

export function TerrazzoChip({ shape, color, className = "" }: TerrazzoChipProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={`block h-full w-full ${className}`}
    >
      <path d={SHAPES[shape % SHAPES.length]} fill={color} />
    </svg>
  );
}
