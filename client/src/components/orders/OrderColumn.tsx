import type { Order, OrderStatus } from "@/types/order";
import { OrderCard } from "./OrderCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface OrderColumnProps {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onOpenDetail: (id: string) => void;
}

export function OrderColumn({ title, status, orders, onOpenDetail }: OrderColumnProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: `var(--color-status-${status})` }}
          aria-hidden="true"
        />
        <h2 className="font-heading text-sm font-bold text-foreground/80">{title}</h2>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-foreground/75">
          {orders.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {orders.length === 0 ? (
          <EmptyState icon="icon-[mdi--tray]" title="Rien ici pour le moment" />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onOpenDetail={() => onOpenDetail(order._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
