import type { OrderStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Nouvelle",
  ready: "Prête",
  out_for_delivery: "En livraison",
  completed: "Terminée",
  cancelled: "Annulée",
};

const STATUS_ICONS: Record<OrderStatus, string> = {
  pending: "icon-[mdi--bell-ring-outline]",
  ready: "icon-[mdi--check-circle-outline]",
  out_for_delivery: "icon-[mdi--moped-outline]",
  completed: "icon-[mdi--check-all]",
  cancelled: "icon-[mdi--close-circle-outline]",
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

// Un seul endroit qui décide "quelle couleur pour quel statut" — si la palette
// change un jour, c'est ici et nulle part ailleurs.
export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, var(--color-status-${status}) 16%, transparent)`,
        color: `var(--color-status-${status})`,
      }}
    >
      <span className={`${STATUS_ICONS[status]} text-sm`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
