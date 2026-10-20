import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/**
 * Restriction admin de /utilisateurs, remplaçant la prop adminOnly.
 *
 * Un layout imbriqué plutôt qu'un flag passé à la page : la contrainte est
 * portée par la route elle-même, donc impossible de l'oublier en ajoutant une
 * sous-page — /utilisateurs/[id] hériterait automatiquement de la protection.
 *
 * getSession() est mémoïsé par cache(), donc l'appel du layout parent n'est
 * pas refait ici.
 */
export default async function UtilisateursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (user?.role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
