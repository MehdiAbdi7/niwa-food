import { MenuItemsTab } from "@/components/menu/MenuItemsTab";
import { PageHeader } from "@/components/dashboard/PageHeader";

// Server Component : la page n'est plus qu'un point de montage, sans état ni
// interactivité propre. MenuItemsTab garde son "use client" et devient la
// frontière — Next sérialise le reste côté serveur.
//
// Pas de restriction admin ici : un employé doit pouvoir consulter le menu et
// les prix pour prendre une commande — seules les actions de création /
// édition / suppression sont réservées admin (voir MenuItemsTab, qui masque
// ses boutons selon isAdmin).
export default function MenuPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Menu"
        description="Organise tes produits, tes catégories et les options proposées aux clients."
      />
      <MenuItemsTab />
    </div>
  );
}
