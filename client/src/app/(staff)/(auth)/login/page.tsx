import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

/**
 * Coquille serveur autour du formulaire.
 *
 * LoginForm lit `?from=` via useSearchParams(), qui n'a pas de valeur au
 * prerender statique : React doit pouvoir suspendre cette partie de l'arbre
 * et servir le fallback en attendant l'hydratation côté client. La frontière
 * doit être ICI, au-dessus — un <Suspense> placé dans LoginForm lui-même
 * arriverait trop tard, le composant ayant déjà bailé out.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="background flex min-h-screen items-center justify-center">
          <span className="icon-[mdi--loading] animate-spin text-4xl text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
