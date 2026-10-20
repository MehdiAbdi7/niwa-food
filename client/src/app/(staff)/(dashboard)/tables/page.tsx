"use client";

import { useState } from "react";
import { TableCard } from "@/components/tables/TableCard";
import { TableFormModal } from "@/components/tables/TableFormModal";
import { Button } from "@/components/ui/Button";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useGetTablesQuery } from "@/features/tables/tableApi";
import { useActiveStore } from "@/features/store/useActiveStore";
import { useAuth } from "@/features/auth/useAuth";
import { STORE_LABELS, type Store } from "@/types/store";
import type { RestaurantTable } from "@/types/table";

// Modèle à appliquer aux 6 autres pages : plus de <DashboardShell> ni de
// composant *Content interne. Le layout fournit la coquille et garantit la
// session, la page ne fait plus que son métier.
//
// Étape suivante (phase 2) : cette page devient un Server Component qui
// preload les tables via serverFetch, et ne garde en client que les parties
// interactives (modales, boutons).
export default function TablesPage() {
  const { isAdmin } = useAuth();
  const { activeStore } = useActiveStore();
  const {
    data: tables,
    isLoading,
    isError,
  } = useGetTablesQuery({ store: activeStore });

  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) return <SkeletonGrid count={8} />;

  if (isError) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Impossible de charger les tables"
        description="Vérifie ta connexion, puis recharge la page."
      />
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <>
        <EmptyState
          icon="icon-[mdi--table-furniture]"
          title="Aucune table configurée"
          description={
            isAdmin ? "Ajoute la première table pour commencer." : undefined
          }
          action={
            isAdmin && (
              <Button
                icon="icon-[mdi--plus]"
                onClick={() => setIsCreating(true)}
              >
                Ajouter une table
              </Button>
            )
          }
        />
        <TableFormModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          table={null}
          defaultStore={activeStore}
        />
      </>
    );
  }

  // Regroupement par magasin : utile même en vue filtrée pour garder un titre
  // de section cohérent, indispensable en vue "Tous".
  const groups = tables.reduce<Record<Store, RestaurantTable[]>>(
    (acc, table) => {
      (acc[table.store] ??= []).push(table);
      return acc;
    },
    {} as Record<Store, RestaurantTable[]>,
  );

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Salle"
        title="Tables"
        description="Visualise l'implantation de la salle et garde chaque table à jour."
        action={
          isAdmin ? (
            <Button icon="icon-[mdi--plus]" onClick={() => setIsCreating(true)}>
              Ajouter une table
            </Button>
          ) : undefined
        }
      />

      {Object.entries(groups).map(([store, storeTables]) => (
        <section key={store} className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground/75">
            {STORE_LABELS[store as Store]} · {storeTables.length} table
            {storeTables.length > 1 ? "s" : ""}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {storeTables
              .slice()
              .sort((a, b) => a.tableN - b.tableN)
              .map((table) => (
                <TableCard
                  key={table._id}
                  table={table}
                  isAdmin={isAdmin}
                  onEdit={() => setEditingTable(table)}
                />
              ))}
          </div>
        </section>
      ))}

      <TableFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        table={null}
        defaultStore={activeStore}
      />
      <TableFormModal
        isOpen={editingTable !== null}
        onClose={() => setEditingTable(null)}
        table={editingTable}
      />
    </div>
  );
}
