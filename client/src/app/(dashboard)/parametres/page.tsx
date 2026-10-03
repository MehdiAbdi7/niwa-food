import { ProfileCard } from "@/components/settings/ProfileCard";
import { ServiceManagementCard } from "@/components/settings/ServiceManagementCard";
import { OrderIntakeCard } from "@/components/settings/OrderIntakeCard";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { SessionCard } from "@/components/settings/SessionCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

// Déjà un Server Component : la page n'est qu'un assemblage, chaque carte gère
// son propre état côté client. C'est exactement la forme visée pour les autres
// pages en phase 2.
//
// OrderIntakeCard est placée juste après ServiceManagementCard : les deux
// parlent du même moment de la journée (ouverture et fermeture), et ouvrir un
// service rouvre les commandes — les voir voisines rend le lien évident.
export default function ParametresPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Personnalise ton espace de travail et les règles de service."
      />
      <ProfileCard />
      <ServiceManagementCard />
      <OrderIntakeCard />
      <AppearanceCard />
      <SessionCard />
    </div>
  );
}
