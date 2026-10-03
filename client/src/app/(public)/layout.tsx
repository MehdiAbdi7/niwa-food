import Footer from "@/components/public/Footer";
import Navbar from "@/components/public/Navbar";
import { CartSheet } from "@/components/publicOrder/CartSheet";
import { CartHydrator } from "@/features/publicOrder/CartHydrator";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background text-foreground">
      {/* Ne rend rien : relit le panier sauvegardé et le pousse dans Redux.
          Ici et non dans /commande, car le bouton panier de la navbar doit
          afficher le bon compte dès l'accueil. */}
      <CartHydrator />

      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Monté ici et non dans /commande : le bouton panier de la navbar est
          présent sur toutes les pages publiques, il lui faut un ticket à
          ouvrir partout. Le composant ne rend rien tant qu'il est fermé. */}
      <CartSheet />
    </div>
  );
}
