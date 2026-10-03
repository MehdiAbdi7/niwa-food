import type { Order, OrderStatus } from "@/types/order";

// Miroir de ALLOWED_TRANSITIONS dans order.controller.ts — à garder synchronisé.
// Le backend reste la source de vérité (il revalide tout) ; ceci ne sert qu'à
// ne pas proposer de bouton qui échouerait systématiquement.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["ready", "out_for_delivery", "completed", "cancelled"],
  ready: ["out_for_delivery", "completed"],
  out_for_delivery: ["completed"],
  completed: [],
  cancelled: [],
};

export interface NextAction {
  status: OrderStatus;
  label: string;
  icon: string;
}

// Une seule action "primaire" mise en avant par carte, pour rester lisible en
// coup de feu — le reste (annuler, etc.) passe par un menu secondaire.
export function getPrimaryAction(order: Order): NextAction | null {
  const possible = ALLOWED_TRANSITIONS[order.status];

  if (order.status === "pending") {
    return { status: "ready", label: "Marquer prête", icon: "icon-[mdi--check-circle-outline]" };
  }

  if (order.status === "ready") {
    if (order.type === "delivery" && possible.includes("out_for_delivery")) {
      return {
        status: "out_for_delivery",
        label: "Envoyer en livraison",
        icon: "icon-[mdi--moped-outline]",
      };
    }
    return { status: "completed", label: "Terminer", icon: "icon-[mdi--check-all]" };
  }

  if (order.status === "out_for_delivery") {
    return { status: "completed", label: "Marquer livrée", icon: "icon-[mdi--check-all]" };
  }

  return null;
}

export function canCancel(order: Order): boolean {
  return ALLOWED_TRANSITIONS[order.status].includes("cancelled");
}
