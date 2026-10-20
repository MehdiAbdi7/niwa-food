import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SessionSync } from "@/features/auth/SessionSync";
import { ToastContainer } from "@/features/toast/ToastContainer";
import { DeliveryHeader } from "@/components/delivery/DeliveryHeader";

/**
 * Coquille de l'espace livreur.
 *
 * Volontairement SANS sidebar, bottom-nav ni topbar : il n'y a qu'un seul
 * écran, donc rien à naviguer. Toute la surface va aux courses, ce qui compte
 * sur un téléphone tenu d'une main.
 *
 * Le garde est le symétrique exact de celui du dashboard : chaque rôle est
 * renvoyé chez lui, et la contrainte est portée par la route plutôt que par un
 * drapeau qu'on pourrait oublier en ajoutant une page ici.
 */
export default async function LivraisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) redirect("/login");
  if (user.role !== "delivery") redirect("/dashboard");

  return (
    <>
      {/* Indispensable : c'est ce dispatch qui ouvre le socket et fait
          rejoindre la room delivery:<id> (voir socketMiddleware). Sans lui, le
          livreur devrait rafraîchir pour voir arriver une nouvelle course. */}
      <SessionSync user={user} />

      <div className="dashboard-shell flex min-h-screen flex-col bg-background">
        <DeliveryHeader />

        {/* pb généreux : le pouce atteint le bas de l'écran, et la dernière
            carte ne doit pas se retrouver collée à la barre du navigateur. */}
        <main className="flex-1 px-4 pb-16 pt-5 sm:px-6">
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </main>
      </div>

      <ToastContainer />
    </>
  );
}
