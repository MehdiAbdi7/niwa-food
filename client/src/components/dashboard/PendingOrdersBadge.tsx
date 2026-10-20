interface PendingOrdersBadgeProps {
  count: number;
  className?: string; // placement, propre à la Sidebar ou à la BottomNav
}

// Pastille du nombre de commandes « Nouvelles », à côté de « Commandes ».
// Le nombre vient de usePendingOrders, appelé par le parent : la Sidebar en a
// besoin aussi pour savoir s'il faut masquer son point de page active.
export function PendingOrdersBadge({ count, className = "" }: PendingOrdersBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none tabular-nums text-on-primary ${className}`}
    >
      {count > 99 ? "99+" : count}
      {/* Lu « Commandes, 3 nouvelles commandes » par un lecteur d'écran,
          au lieu d'un « 3 » sans contexte. */}
      <span className="sr-only">
        {count > 1 ? " nouvelles commandes" : " nouvelle commande"}
      </span>
    </span>
  );
}
