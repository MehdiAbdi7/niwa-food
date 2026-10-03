import { STORE_LOCATIONS } from "@/config/locations";
import { DEMO_MODE, SITE_URL } from "@/config/site";

// Horaires au format schema.org : du samedi au jeudi 11h-00h30, le vendredi
// à partir de 18h. Une fermeture après minuit s'écrit telle quelle (00:30),
// Google la comprend comme le lendemain.
const OPENING_HOURS_SPEC = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
    ],
    opens: "11:00",
    closes: "00:30",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "Friday",
    opens: "18:00",
    closes: "00:30",
  },
];

/**
 * Données structurées schema.org pour les deux restaurants.
 *
 * Invisible à l'écran : c'est un bloc JSON que Google lit pour afficher
 * adresse, téléphone et horaires directement dans ses résultats. Désactivé
 * en démo, car il affirmerait à Google que ce site est celui du restaurant.
 */
export function RestaurantJsonLd() {
  if (DEMO_MODE) return null;

  const data = {
    "@context": "https://schema.org",
    "@graph": STORE_LOCATIONS.map((location) => ({
      "@type": "Restaurant",
      "@id": `${SITE_URL}/#${location.slug}`,
      name: `Niwa Food ${location.name}`,
      url: SITE_URL,
      menu: `${SITE_URL}/commande`,
      image: `${SITE_URL}${location.image}`,
      telephone: location.phoneHref.replace("tel:", ""),
      servesCuisine: ["Burgers", "Tacos", "Pizzas", "Fast-food"],
      priceRange: "DA",
      acceptsReservations: false,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.address,
        addressLocality: location.name,
        addressRegion: "Alger",
        addressCountry: "DZ",
      },
      hasMap: location.mapUrl,
      openingHoursSpecification: OPENING_HOURS_SPEC,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify échappe déjà les guillemets ; le remplacement de « < »
      // empêche une valeur de fermer la balise <script> par accident.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
