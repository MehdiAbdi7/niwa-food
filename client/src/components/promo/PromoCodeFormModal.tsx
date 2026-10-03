/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import {
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
} from "@/features/promo/promoApi";
import { useToast } from "@/features/toast/useToast";
import { getApiErrorMessage } from "@/lib/apiError";
import { ORDER_TYPE_ICONS, ORDER_TYPE_LABELS } from "@/lib/orderLabels";
import { ORDER_TYPES, type OrderType } from "@/types/order";
import { normalizePromoCode, type PromoCode } from "@/types/promoCode";

interface PromoCodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  promo: PromoCode | null; // null = création
}

/**
 * Convertit une date ISO en valeur d'<input type="datetime-local">.
 *
 * PAS de toISOString().slice(0,16) : celui-ci renvoie l'heure UTC, donc une
 * échéance saisie à 23h00 réapparaîtrait à 22h00 à l'édition, et se décalerait
 * un peu plus à chaque enregistrement. On passe par les getters LOCAUX, qui
 * sont ceux que le champ attend.
 */
function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => value.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Chemin inverse. Un champ vidé renvoie `null` et NON `undefined` : une clé
 * absente laisserait l'ancienne date en base, alors que l'admin vient
 * justement de l'effacer.
 */
function toIsoOrNull(value: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Champ numérique facultatif : vide = contrainte retirée, donc null. */
function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function PromoCodeFormModal({
  isOpen,
  onClose,
  promo,
}: PromoCodeFormModalProps) {
  const isEditing = promo !== null;

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createPromo, { isLoading: isCreating }] = useCreatePromoCodeMutation();
  const [updatePromo, { isLoading: isUpdating }] = useUpdatePromoCodeMutation();
  const toast = useToast();
  const isLoading = isCreating || isUpdating;

  // Réinitialise à chaque ouverture — sinon un code édité laisserait ses
  // valeurs dans le formulaire de création suivant.
  useEffect(() => {
    if (!isOpen) return;
    setCode(promo?.code ?? "");
    setDescription(promo?.description ?? "");
    setDiscountPercent(promo?.discountPercent?.toString() ?? "10");
    setMaxDiscountAmount(promo?.maxDiscountAmount?.toString() ?? "");
    setMinOrderAmount(promo?.minOrderAmount?.toString() ?? "");
    setStartsAt(toLocalInputValue(promo?.startsAt));
    setEndsAt(toLocalInputValue(promo?.endsAt));
    setMaxUses(promo?.maxUses?.toString() ?? "");
    setOrderTypes(promo?.orderTypes ?? []);
    setActive(promo?.active ?? true);
    setError(null);
  }, [isOpen, promo]);

  function toggleOrderType(type: OrderType) {
    setOrderTypes((previous) =>
      previous.includes(type)
        ? previous.filter((current) => current !== type)
        : [...previous, type],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const normalizedCode = normalizePromoCode(code);

    if (normalizedCode.length < 2) {
      setError("Le code doit faire au moins 2 caractères");
      return;
    }

    if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
      setError("Le code ne peut contenir que des lettres, chiffres et tirets");
      return;
    }

    const percent = Number(discountPercent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      setError("Le pourcentage doit être un entier entre 1 et 100");
      return;
    }

    const start = toIsoOrNull(startsAt);
    const end = toIsoOrNull(endsAt);

    // Contrôlé aussi côté backend (pre("validate") du modèle) : ici c'est pour
    // que l'admin voie l'erreur sans aller-retour réseau.
    if (start && end && new Date(end) <= new Date(start)) {
      setError("La date de fin doit être postérieure à la date de début");
      return;
    }

    const payload = {
      code: normalizedCode,
      description: description.trim() || undefined,
      discountPercent: percent,
      maxDiscountAmount: toNumberOrNull(maxDiscountAmount),
      minOrderAmount: toNumberOrNull(minOrderAmount),
      startsAt: start,
      endsAt: end,
      maxUses: toNumberOrNull(maxUses),
      orderTypes,
      active,
    };

    try {
      if (isEditing) {
        await updatePromo({ id: promo._id, body: payload }).unwrap();
        toast.success("Code promo mis à jour");
      } else {
        await createPromo(payload).unwrap();
        toast.success(`Code ${normalizedCode} créé`);
      }
      onClose();
    } catch (err) {
      // Le 409 du doublon remonte déjà avec « Ce code existe déjà ».
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier ${promo.code}` : "Nouveau code promo"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" form="promo-form" isLoading={isLoading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </>
      }
    >
      <form
        id="promo-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
      >
        {/* ---------- L'essentiel ---------- */}
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <Input
            id="code"
            label="Code"
            value={code}
            // Majuscules à la frappe : c'est sous cette forme qu'il est stocké
            // et comparé, autant que l'admin voie exactement ce qui partira.
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="NIWA10"
            className="font-heading font-bold uppercase tracking-wider"
            required
          />
          <Input
            id="discountPercent"
            label="Remise (%)"
            type="number"
            min={1}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            required
          />
        </div>

        <Input
          id="description"
          label="Note interne"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ouverture Chéraga, flyers novembre..."
        />
        <p className="-mt-3 text-xs text-foreground/45">
          Visible ici uniquement — le client ne la voit jamais.
        </p>

        {/* ---------- Contraintes ---------- */}
        <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
          <div className="flex flex-col">
            <p className="font-heading text-sm font-bold text-foreground">
              Conditions
            </p>
            <p className="text-xs text-foreground/75">
              Toutes facultatives. Un champ laissé vide signifie « aucune
              limite ».
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Input
                id="maxDiscountAmount"
                label="Plafond de la remise (DA)"
                type="number"
                min={0}
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Aucun"
              />
              {/* Le conseil vaut d'être écrit : c'est la contrainte qu'on
                  oublie, et celle qui coûte le plus cher quand elle manque. */}
              <p className="text-xs text-foreground/45">
                Recommandé : sans plafond, −{discountPercent || "10"}% sur une
                commande de groupe peut représenter plus de 1 000 DA.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Input
                id="minOrderAmount"
                label="Panier minimum (DA)"
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="Aucun"
              />
              <p className="text-xs text-foreground/45">
                Porte sur les articles seuls, hors frais de livraison.
              </p>
            </div>

            <Input
              id="startsAt"
              label="Valable à partir du"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />

            <Input
              id="endsAt"
              label="Jusqu'au"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <Input
                id="maxUses"
                label="Nombre d'utilisations maximum"
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Illimité"
              />
              <p className="text-xs text-foreground/45">
                Total, tous clients confondus.
                {isEditing &&
                  ` Déjà utilisé ${promo.usedCount} fois.`}
              </p>
            </div>
          </div>

          {/* Modes de service : rien de coché = tous. Le dire explicitement
              évite qu'on croie devoir en cocher au moins un. */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">
              Modes de service concernés
            </p>
            <div className="flex flex-wrap gap-2">
              {ORDER_TYPES.map((type) => {
                const isSelected = orderTypes.includes(type);

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleOrderType(type)}
                    aria-pressed={isSelected}
                    className={`flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border-subtle text-foreground/75 hover:border-primary/50"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${ORDER_TYPE_ICONS[type]} text-base`}
                    />
                    {ORDER_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-foreground/45">
              {orderTypes.length === 0
                ? "Aucun sélectionné : le code s'applique à tous les modes."
                : "Le code sera refusé sur les autres modes."}
            </p>
          </div>
        </div>

        {/* ---------- Interrupteur ---------- */}
        <div className="border-t border-border-subtle pt-4">
          <Switch
            checked={active}
            onChange={setActive}
            label="Code actif"
          />
          <p className="mt-1 text-xs text-foreground/45">
            Désactiver coupe le code immédiatement, sans toucher aux dates ni
            aux commandes déjà passées.
          </p>
        </div>

        {error && <p className="text-sm text-accent-bordeaux">{error}</p>}
      </form>
    </Modal>
  );
}
