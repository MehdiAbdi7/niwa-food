import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SessionSync } from "@/features/auth/SessionSync";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Topbar } from "@/components/dashboard/Topbar";
import { ToastContainer } from "@/features/toast/ToastContainer";

/**
 * Coquille commune à toutes les pages du dashboard.
 *
 * Server Component : la session est vérifiée avant le moindre pixel, donc plus
 * de <AuthGuard> à répéter dans chaque page et plus d'écran de chargement le
 * temps de lire localStorage. Un visiteur sans session ne reçoit jamais le
 * HTML des pages protégées — il est redirigé pendant le rendu.
 *
 * Les pages sous ce layout n'ont plus qu'à exporter leur contenu.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Filet derrière le proxy : celui-ci ne fait que constater la présence
  // du cookie, il ne peut pas vérifier la signature du JWT sur le runtime Edge.
  // Un cookie forgé ou expiré est arrêté ici.
  if (!user) redirect("/login");

  // Un livreur possède une session parfaitement valide : sans ce garde, il
  // recevrait le HTML du dashboard. Les données, elles, lui seraient refusées
  // en 403 par isStaff — il verrait donc une coquille vide et des erreurs
  // partout, ce qui est pire qu'une redirection franche.
  if (user.role === "delivery") redirect("/livraison");

  return (
    <>
      <SessionSync user={user} />

      {/* .dashboard-shell rétablit le curseur système (voir globals.css) —
          la précision prime ici, contrairement au site public. */}
      <div className="dashboard-shell flex min-h-screen background">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-x-clip px-4 pb-24 pt-5 sm:px-6 sm:pb-8 sm:pt-7 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>

        <BottomNav />
      </div>

      <ToastContainer />
    </>
  );
}
