/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "@/features/auth/authApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { STORES, STORE_LABELS, type Store } from "@/types/store";
import type { User, UserRole } from "@/types/user";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; // null = création
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "employee", label: "Employé" },
  { value: "admin", label: "Administrateur" },
  { value: "delivery", label: "Livreur" },
];

// Pas de champ mot de passe en édition : le backend n'expose aucune route de
// réinitialisation (voir updateUserSchema, qui ne l'accepte pas). Un
// changement de mot de passe reste à faire directement en base pour l'instant.
export function UserFormModal({ isOpen, onClose, user }: UserFormModalProps) {
  const isEditing = user !== null;

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [store, setStore] = useState<Store>(STORES[0]);
  const [error, setError] = useState<string | null>(null);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const toast = useToast();
  const isLoading = isCreating || isUpdating;

  // Seul l'admin est transverse : employé comme livreur appartiennent à un
  // magasin. Pour un livreur, c'est ce qui l'empêche d'être assigné à une
  // course de l'autre restaurant (le backend le refuse).
  const needsStore = role !== "admin";

  useEffect(() => {
    if (!isOpen) return;
    setFirstname(user?.firstname ?? "");
    setLastname(user?.lastname ?? "");
    setEmail(user?.email ?? "");
    setTel(user?.tel ?? "");
    setPassword("");
    setRole(user?.role ?? "employee");
    setStore(user?.store ?? STORES[0]);
    setError(null);
  }, [isOpen, user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (isEditing) {
        await updateUser({
          id: user._id,
          body: {
            firstname,
            lastname,
            email,
            tel,
            role,
            store: needsStore ? store : undefined,
          },
        }).unwrap();
        toast.success("Compte mis à jour");
      } else {
        await createUser({
          firstname,
          lastname,
          email,
          tel,
          password,
          role,
          store: needsStore ? store : undefined,
        }).unwrap();
        toast.success("Compte créé");
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier le compte" : "Nouveau compte"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" form="user-form" isLoading={isLoading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
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

        {!isEditing && (
          <Input
            id="password"
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="role"
            label="Rôle"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={ROLE_OPTIONS}
          />
          {needsStore && (
            <Select
              id="store"
              label="Magasin"
              value={store}
              onChange={(e) => setStore(e.target.value as Store)}
              options={STORES.map((s) => ({
                value: s,
                label: STORE_LABELS[s],
              }))}
            />
          )}
        </div>

        {/* Le livreur se connecte comme tout le monde : email + mot de passe.
            Son numéro sert au staff pendant le service, pas à l'identifier. */}
        {role === "delivery" && !isEditing && (
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-xs leading-relaxed text-foreground/75">
            Le livreur se connectera avec cet email et ce mot de passe. Il
            n&apos;aura accès qu&apos;à ses propres courses, jamais au reste du
            dashboard. Un email interne suffit (ex :{" "}
            <span className="font-semibold">prenom.livreur@niwafood.dz</span>).
          </p>
        )}

        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
