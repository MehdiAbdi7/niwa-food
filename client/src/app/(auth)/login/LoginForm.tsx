"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, getHomePathForRole } from "@/features/auth/useAuth";
import { ThemeToggle } from "@/components/public/themeToggle";
import { getApiErrorMessage } from "@/lib/apiError";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoginLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const loggedUser = await login(email, password);

      const home = getHomePathForRole(loggedUser.role);

      // Renvoie là où l'employé voulait aller avant d'être intercepté par le
      // proxy. On ne garde que les chemins internes : accepter une URL absolue
      // ouvrirait une redirection ouverte (?from=https://…).
      //
      // Un LIVREUR ignore `from` : ce paramètre pointe forcément vers une page
      // du dashboard, où le layout le renverrait aussitôt. Autant lui épargner
      // l'aller-retour et l'envoyer directement sur ses courses.
      const from = searchParams.get("from");
      const destination =
        loggedUser.role !== "delivery" && from?.startsWith("/") ? from : home;

      router.replace(destination);
      // Indispensable : le cookie vient d'être posé, mais les Server Components
      // ont déjà été rendus sans session. Sans refresh, le layout dashboard
      // resservirait son rendu « non connecté » et renverrait vers /login.
      router.refresh();
    } catch (err) {
      // Le 429 du rate limiter renvoie déjà un délai précis dans le message.
      setErrorMessage(
        getApiErrorMessage(err, "Une erreur est survenue, réessayez."),
      );
    }
  }

  return (
    <div className="background relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-foreground bg-background p-8 shadow-food-md dark:bg-primary/20">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Image src="/logo-niwa.png" alt="Niwa Food" width={56} height={56} />
          <h1 className="font-heading text-xl font-bold text-foreground">
            Espace équipe
          </h1>
          <p className="text-sm text-foreground/75">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-primary/30 bg-background px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-foreground"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-primary/30 bg-background px-4 py-2.5 text-foreground outline-none transition-colors focus:border-primary"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-accent-bordeaux/10 px-3 py-2 text-sm text-accent-bordeaux">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoginLoading}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-bold text-on-primary transition-all hover:bg-accent-slate disabled:opacity-60"
          >
            {isLoginLoading && (
              <span className="icon-[mdi--loading] animate-spin text-lg" />
            )}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
