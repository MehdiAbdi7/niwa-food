"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUpdateOwnProfileMutation } from "@/features/auth/authApi";
import { useAppDispatch } from "@/lib/hooks";
import { currentUserUpdated } from "@/features/auth/authSlice";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";

export function ProfileCard() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [updateOwnProfile, { isLoading }] = useUpdateOwnProfileMutation();
  const toast = useToast();

  const [firstname, setFirstname] = useState(user?.firstname ?? "");
  const [lastname, setLastname] = useState(user?.lastname ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [tel, setTel] = useState(user?.tel ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    try {
      const updated = await updateOwnProfile({ firstname, lastname, email, tel }).unwrap();
      // Pousse le résultat dans authSlice pour que le reste de l'app (sidebar,
      // topbar...) reflète le changement sans recharger la page.
      dispatch(currentUserUpdated(updated));
      toast.success("Profil mis à jour");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <h2 className="font-heading text-base font-bold text-foreground">Mon profil</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="firstname"
            label="Prénom"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
          <Input
            id="lastname"
            label="Nom"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />
        </div>
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="tel"
          label="Téléphone"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          required
        />

        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </section>
  );
}
