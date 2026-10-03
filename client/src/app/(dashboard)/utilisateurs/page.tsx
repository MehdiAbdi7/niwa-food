"use client";

import { useState } from "react";
import { UserFormModal } from "@/components/users/UserFormModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
} from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { STORE_LABELS } from "@/types/store";
import { ROLE_LABELS, type User, type UserRole } from "@/types/user";

/**
 * Couleur du badge par rôle.
 *
 * Le livreur a la teinte `primary`, la même que l'icône de scooter du reste de
 * l'app : c'est le seul rôle qui ne travaille pas dans le restaurant, autant
 * qu'il se distingue au premier coup d'œil dans la liste.
 */
const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin: "bg-accent-mustard/15 text-accent-mustard",
  employee: "bg-accent-green/15 text-accent-green",
  delivery: "bg-primary/15 text-primary",
};

// La restriction admin vit dans (dashboard)/utilisateurs/layout.tsx, donc côté
// serveur : le HTML de cette page n'est jamais envoyé à un employé.
export default function UtilisateursPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const toast = useToast();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  async function handleDelete() {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser._id).unwrap();
      toast.success("Compte supprimé");
      setDeletingUser(null);
    } catch (err) {
      // Le backend refuse : suppression de soi-même, ou dernier admin restant
      toast.error(getApiErrorMessage(err, "Impossible de supprimer ce compte"));
    }
  }

  if (isLoading) return <SkeletonGrid count={6} />;

  if (isError) {
    return (
      <EmptyState
        icon="icon-[mdi--cloud-off-outline]"
        title="Impossible de charger l'équipe"
        description="Vérifie ta connexion, puis recharge la page."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Équipe"
        description="Gère les accès et les rôles des personnes qui font vivre les restaurants, livreurs compris."
        action={
          <Button
            icon="icon-[mdi--account-plus-outline]"
            onClick={() => setIsCreating(true)}
          >
            Nouveau compte
          </Button>
        }
      />

      {!users || users.length === 0 ? (
        <EmptyState
          icon="icon-[mdi--account-group-outline]"
          title="Aucun compte"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => {
            const isSelf = user._id === currentUser?._id;
            return (
              <div
                key={user._id}
                // Mobile : identité sur une ligne, badges + actions sur la suivante.
                // sm+ : tout revient sur une seule ligne comme avant.
                className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                {/* Identité — min-w-0 casse le min-width:auto du flex item,
                    sinon l'email long pousse les actions hors de l'écran. */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold text-primary">
                    {user.firstname[0]}
                    {user.lastname[0]}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-foreground">
                      {user.firstname} {user.lastname}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-foreground/40">
                          (vous)
                        </span>
                      )}
                    </span>
                    <span className="truncate text-xs text-foreground/75">
                      {/* Pour un livreur, le téléphone compte plus que l'email :
                          c'est par là qu'on le joint pendant le service. */}
                      {user.role === "delivery" ? user.tel : user.email}
                    </span>
                  </div>
                </div>

                {/* Badges + actions */}
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_BADGE_CLASSES[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                    {user.store && (
                      <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-foreground/75">
                        {STORE_LABELS[user.store]}
                      </span>
                    )}
                  </div>

                  {/* shrink-0 : les boutons ne se compressent jamais */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditingUser(user)}
                      aria-label="Modifier"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-surface-2 hover:text-foreground"
                    >
                      <span className="icon-[mdi--pencil-outline] text-base" />
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => setDeletingUser(user)}
                        aria-label="Supprimer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/75 hover:bg-accent-bordeaux/10 hover:text-accent-bordeaux"
                      >
                        <span className="icon-[mdi--trash-can-outline] text-base" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UserFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        user={null}
      />
      <UserFormModal
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        user={editingUser}
      />
      <ConfirmDialog
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title={`Supprimer le compte de ${deletingUser?.firstname} ?`}
        description={
          deletingUser?.role === "delivery"
            ? "Ses courses en cours resteront visibles sur le dashboard, où le staff pourra les valider."
            : "Cette action est irréversible."
        }
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
