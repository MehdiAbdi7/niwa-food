import { notFound } from "next/navigation";

/**
 * Toute adresse publique qui ne correspond à aucune page.
 *
 * Sans ce fichier, une adresse inconnue n'entrerait jamais dans app/[lang],
 * et Next afficherait sa page 404 par défaut, en anglais et sans le site
 * autour. Ici, notFound() fait afficher app/[lang]/not-found.tsx, dans la
 * langue de l'adresse et avec la navbar.
 */
export default function UnknownPage() {
  notFound();
}
