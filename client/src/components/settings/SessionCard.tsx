"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { STORE_LABELS } from "@/types/store";

export function SessionCard() {
  const { user, isAdmin, logout } = useAuth();
  if (!user) return null;

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <h2 className="font-heading text-base font-bold text-foreground">Session</h2>

      <div className="flex flex-col gap-1 text-sm text-foreground/70">
        <p>
          Connecté en tant que <span className="font-semibold text-foreground">{user.email}</span>
        </p>
        <p>
          Rôle : <span className="font-semibold text-foreground">{isAdmin ? "Administrateur" : "Employé"}</span>
          {user.store && ` · ${STORE_LABELS[user.store]}`}
        </p>
      </div>

      <div>
        <Button variant="danger" icon="icon-[mdi--logout]" onClick={logout}>
          Se déconnecter
        </Button>
      </div>
    </section>
  );
}
