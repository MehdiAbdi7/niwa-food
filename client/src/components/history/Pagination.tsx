"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Grise les contrôles pendant un chargement, sans les faire disparaître. */
  isBusy?: boolean;
}

function PageButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      // 40px de côté : atteignable au doigt sur la tablette du comptoir.
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle text-foreground/70 transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border-subtle"
    >
      <span aria-hidden="true" className={`${icon} text-lg`} />
    </button>
  );
}

/**
 * Pagination compacte : premier / précédent / position / suivant / dernier.
 *
 * Pas de liste de numéros de page : sur un historique annuel il peut y avoir
 * 200 pages, et une pagination numérotée devient soit tronquée à coups de
 * « … », soit ingérable sur mobile. Le calendrier est de toute façon le vrai
 * outil de navigation — la pagination ne sert qu'à parcourir une sélection
 * déjà resserrée.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isBusy = false,
}: PaginationProps) {
  // Une seule page : afficher des flèches toutes grisées est du bruit.
  if (totalPages <= 1) return null;

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      aria-label="Pagination de l'historique"
      className={`flex items-center justify-center gap-2 transition-opacity ${
        isBusy ? "opacity-60" : ""
      }`}
    >
      <PageButton
        icon="icon-[mdi--chevron-double-left]"
        label="Première page"
        disabled={isFirst || isBusy}
        onClick={() => onPageChange(1)}
      />
      <PageButton
        icon="icon-[mdi--chevron-left]"
        label="Page précédente"
        disabled={isFirst || isBusy}
        onClick={() => onPageChange(currentPage - 1)}
      />

      {/* aria-live : un lecteur d'écran doit entendre le changement de page,
          alors que le focus reste sur le bouton fléché. */}
      <span
        aria-live="polite"
        className="tabular-nums min-w-20 text-center text-sm font-semibold text-foreground/70"
      >
        {currentPage} / {totalPages}
      </span>

      <PageButton
        icon="icon-[mdi--chevron-right]"
        label="Page suivante"
        disabled={isLast || isBusy}
        onClick={() => onPageChange(currentPage + 1)}
      />
      <PageButton
        icon="icon-[mdi--chevron-double-right]"
        label="Dernière page"
        disabled={isLast || isBusy}
        onClick={() => onPageChange(totalPages)}
      />
    </nav>
  );
}
