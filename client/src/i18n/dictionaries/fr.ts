import { plural } from "../text";

/**
 * Textes du site public, en français.
 *
 * C'est la langue de référence : son type (Dictionary, en bas du fichier)
 * est imposé à ar.ts et en.ts. Une clé ajoutée ici et oubliée là-bas est
 * une erreur TypeScript, pas un trou à l'écran.
 *
 * Rangé par endroit du site, dans l'ordre où on le parcourt. Les {noms}
 * entre accolades sont remplacés par fill() ou pluralize() (voir text.ts).
 *
 * Ce qui n'est PAS ici : le menu (noms des plats, descriptions, catégories),
 * qui vient de la base et reste en français dans les trois langues, et les
 * messages d'erreur renvoyés par l'API.
 */
export const fr = {
  meta: {
    title: "Niwa Food — Burgers, tacos et pizzas faits maison à Kouba et Chéraga",
    description:
      "Fast-food fait maison à Alger : burgers, tacos et pizzas préparés minute. Sur place, à emporter ou en livraison à Kouba et Chéraga.",
    // Format des réseaux sociaux (Open Graph) : langue_PAYS.
    ogLocale: "fr_DZ",
  },

  common: {
    close: "Fermer",
    optional: "facultatif",
    retry: "Réessayer",
    seeNumbers: "Voir nos numéros",
    backToMenu: "Retour à la carte",
    order: "Commander",
    seeMenu: "Voir la carte",
    total: "Total",
    itemsTotal: "Articles",
    from: "dès",
    perUnit: "{price} l'unité",
    without: "sans",
    items: plural({ one: "{count} article", other: "{count} articles" }),
    whichStore: "Quel restaurant ?",
    closed: "Fermé",
    loading: "Chargement…",
  },

  stores: {
    kouba: {
      name: "Kouba",
      address: "Parc Ben Omar",
      addressDetail: "Kouba, Alger",
    },
    cheraga: {
      name: "Chéraga",
      address: "Chéraga",
      addressDetail: "Alger Ouest",
    },
  },

  hours: {
    title: "Horaires",
    saturdayToThursday: "Samedi à jeudi",
    friday: "Vendredi",
  },

  orderTypes: {
    dine_in: "Sur place",
    takeaway: "À emporter",
    delivery: "Livraison",
  },

  socialLabel: "Niwa Food sur {network}",
  facadeAlt: "Devanture du restaurant Niwa Food de {name}",

  demoBanner: {
    short: "Site de démo : commandes non transmises au restaurant.",
    long: "Site de démonstration : les commandes ne sont pas transmises au restaurant.",
    author: "Projet personnel de Mehdi Abdi, sans lien officiel avec Niwa Food.",
  },

  nav: {
    home: "Accueil",
    menu: "Menu",
    tracking: "Suivi",
    trackingLong: "Suivi de commande",
    about: "À propos",
    contact: "Contact",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    toggleTheme: "Basculer le thème clair/sombre",
    language: "Langue",
    cart: "Voir mon panier, {items}",
    trackOrder: "Suivre ma commande numéro {number}",
  },

  footer: {
    tagline:
      "Burgers, tacos et pizzas préparés minute, 100% faits maison. Sur place, à emporter, ou livrés chez vous.",
    navigation: "Navigation",
    addresses: "Nos adresses",
    hungry: "Envie de manger ?",
    hungryText: "Composez votre commande en quelques clics.",
    rights: "© {year} Niwa Food — Tous droits réservés",
    credit: "Développé par Mehdi Abdi",
  },

  hero: {
    // Une ligne par étage du titre, qui s'empile au chargement.
    headline: ["Burgers,", "tacos", "et pizzas,", "faits minute."],
    lead: "Préparés à la commande dans nos cuisines de Kouba et Chéraga. Sur place, à emporter ou livrés chez vous.",
    addresses: "Nos deux adresses",
    carouselRole: "carrousel",
    carouselLabel: "Quelques plats de la carte",
    previous: "Plat précédent",
    next: "Plat suivant",
    // Même ordre que les images de Hero.tsx.
    slides: [
      { alt: "Burger Niwa Food", label: "Burger juteux, pain toasté" },
      { alt: "Tacos Niwa Food", label: "Tacos généreux, sauce signature" },
      { alt: "Pizza Niwa Food", label: "Pizza maison, pâte du jour" },
      { alt: "Frites Niwa Food", label: "Frites croustillantes dorées" },
      {
        alt: "Salade César Niwa Food",
        label: "Salade César, croquante et fraîche",
      },
    ],
  },

  bands: {
    menu: [
      "Burgers",
      "Tacos gratinés",
      "Pizzas maison",
      "Frites maison",
      "Fait minute",
    ],
    service: ["Kouba", "Chéraga", "Sur place", "À emporter", "En livraison"],
  },

  bestSellers: {
    title: "Les plus commandés",
    lead: "Les recettes que nos clients reprennent encore et encore.",
    seeAll: "Voir toute la carte",
    loading: "Chargement des best-sellers...",
    error: "Impossible de charger le menu pour le moment.",
    previous: "Produits précédents",
    next: "Produits suivants",
    carouselLabel: "Carrousel des best-sellers",
  },

  howItWorks: {
    title: "De l'écran à votre table",
    lead: "Quatre étapes, et votre commande arrive encore chaude.",
    step: "Étape {number}",
    steps: [
      {
        title: "Choisissez",
        description:
          "Parcourez notre menu et composez votre commande : burgers, tacos, pizzas ou salades.",
      },
      {
        title: "Commandez",
        description:
          "Sur place, à emporter ou en livraison à domicile, vous choisissez ce qui vous arrange.",
      },
      {
        title: "On prépare",
        description:
          "Chaque plat est préparé minute dans nos cuisines, jamais à l'avance.",
      },
      {
        title: "Récupérez",
        description:
          "Récupérez sur place ou faites-vous livrer directement chez vous, encore chaud.",
      },
    ],
  },

  homeAbout: {
    title: "Le burger artisanal, c'est notre spécialité",
    paragraphs: [
      "Chez Niwa Food, tout part d'une idée simple : préparer chaque burger, tacos et pizza comme s'il était le premier. Pain toasté minute, viande fraîche, sauces maison. Rien n'est préparé à l'avance et laissé à attendre.",
      "Depuis nos cuisines à Kouba et Chéraga, on sert celles et ceux qui veulent manger vite sans sacrifier le goût : sur place, à emporter, ou livré directement chez vous.",
    ],
    pauseVideo: "Mettre la vidéo en pause",
    playVideo: "Lancer la vidéo",
    addresses: "adresses à Alger",
    homemade: "fait maison",
    open: "ouvert",
    // {days} est le compteur animé (de 0 à 7).
    daysPerWeek: "{days}j/7",
  },

  testimonials: {
    title: "Ce qu'en disent les habitués",
    demoNotice: "Avis d'exemple pour la démonstration, pas de vrais clients",
    lead: "Des expériences partagées après un passage chez Niwa Food.",
    pause: "Mettre les avis en pause",
    resume: "Relancer les avis",
    rating: "{rating} sur 5 étoiles",
    // Même ordre que les auteurs de Testimonials.tsx.
    texts: [
      "Le burger PIRELLI est devenu mon rituel du vendredi soir. Pain toasté, viande juteuse, rien à dire. La livraison a mis 25 minutes montre en main.",
      "On a commandé pour toute la famille un dimanche, tacos et pizza. Tout est arrivé chaud et bien emballé. Les enfants ont adoré les frites Niwa.",
      "Très bon rapport qualité-prix. J'ai mangé sur place, service rapide même en heure de pointe. Petit bémol sur l'attente un vendredi soir, sinon rien à redire.",
      "La salade César est vraiment fraîche, pas comme certains fast-foods qui la préparent la veille. On sent que c'est fait minute.",
      "Client depuis l'ouverture. La sauce maison sur le tacos GILERA est unique, je ne l'ai trouvée nulle part ailleurs à Alger.",
      "Bonne pizza, pâte bien fine et croustillante. On a commandé à emporter, prêt en 15 minutes comme annoncé. Je recommande.",
    ],
  },

  homeContact: {
    title: "Deux adresses à Alger",
    lead: "Même carte, mêmes horaires, deux cuisines.",
    directions: "Itinéraire",
    directionsLabel: "Itinéraire vers Niwa Food {name} sur Google Maps",
  },

  aboutPage: {
    metaTitle: "À propos — Niwa Food",
    metaDescription:
      "Burgers artisanaux, tacos et pizzas préparés minute à Kouba et Chéraga. Un menu qui porte les noms des légendes de la route.",
    ogDescription:
      "Le burger artisanal, préparé minute. Deux adresses à Alger, un menu nommé comme un garage.",
    eyebrow: "Notre histoire",
    titleStart: "Notre carte se lit",
    titleHighlight: "comme un garage",
    lead: "Niwa Food est un fast-food fait maison, né à Kouba et installé depuis à Chéraga. Notre spécialité tient en deux mots : le burger artisanal.",
    storyTitle: "Tout part d'une idée simple",
    story: [
      "Préparer chaque burger, chaque tacos et chaque pizza comme s'il était le premier de la journée. Rien n'est monté à l'avance pour être réchauffé plus tard : quand vous commandez, on commence.",
      "Le reste, c'est une question de tempérament. On aime les deux-roues, alors nos plats en portent les noms. Un TMAX, un MALOSSI, une VESPA — pas pour faire joli, mais parce que c'est le vocabulaire de la maison, et que nos habitués commandent désormais par plaque plutôt que par ingrédient.",
    ],
    decoderEyebrow: "Le décodeur",
    decoderTitle: "D'où viennent les noms",
    decoderLead:
      "Chaque plat rend hommage à une référence de l'univers du scooter et de la moto. Voici la traduction.",
    // Clé = nom du plat, tel qu'il est écrit sur la carte.
    garage: {
      TMAX: "Le maxi-scooter Yamaha",
      NMAX: "Son petit frère, plus nerveux",
      VESPA: "L'italien qui a tout commencé",
      GILERA: "Constructeur italien de motos",
      POLINI: "Préparateur moteur italien",
      MALOSSI: "Pièces de performance pour scooters",
      GIVI: "Bagagerie et top-cases",
      ARAI: "Les casques japonais",
      "J-COSTA": "Variateurs de transmission",
    },
    methodEyebrow: "En cuisine",
    methodTitle: "Ce qu'on refuse de faire",
    method: [
      {
        title: "Le pain, toasté minute",
        text: "Aucun burger n'attend sous une lampe. Le pain passe au grill au moment où la commande tombe, pas avant.",
      },
      {
        title: "Les sauces, faites ici",
        text: "L'américaine, l'orientale, la blanche : elles sortent de notre cuisine, pas d'un bidon. C'est ce qui fait qu'un burger a un goût qu'on ne retrouve pas ailleurs.",
      },
      {
        title: "La viande, jamais à l'avance",
        text: "Steak haché frais, saisi à la commande. Une viande cuite d'avance perd son jus en dix minutes — on ne prend pas ce raccourci.",
      },
      {
        title: "Livré tant que c'est chaud",
        text: "Sur place, à emporter ou livré autour de Kouba et Chéraga. Le rayon est volontairement court : au-delà, ce n'est plus le même plat qui arrive.",
      },
    ],
    figures: {
      addresses: "adresses à Alger",
      openValue: "7j/7",
      open: "ouvert, le vendredi dès 18h",
      followers: "abonnés sur Instagram",
      homemade: "fait maison",
    },
    ctaTitle: "Le reste se goûte",
    ctaText:
      "Composez votre commande en quelques minutes, sur place, à emporter ou en livraison.",
    ctaAddresses: "Nos adresses",
  },

  contactPage: {
    metaTitle: "Nous contacter — Niwa Food",
    metaDescription:
      "Niwa Food à Kouba (0552 52 00 76) et Chéraga (0549 18 97 27). Ouvert de 11h à 00h30, vendredi à partir de 18h. Sur place, à emporter ou en livraison.",
    ogDescription:
      "Deux adresses à Alger, ouvertes jusqu'à 00h30. Sur place, à emporter ou en livraison.",
    eyebrow: "Où nous trouver",
    titleStart: "Deux adresses,",
    titleHighlight: "un seul régal",
    lead: "Kouba et Chéraga, ouvertes tous les jours jusqu'à 00h30. Un appel suffit pour commander, et le site fait le reste.",
    hoursTitle: "Horaires d'ouverture",
    hoursNote: "Identiques sur les deux adresses.",
    howEyebrow: "Comment commander",
    howTitle: "Trois façons de manger chez nous",
    modes: [
      {
        title: "Sur place",
        text: "Installez-vous, scannez le QR code de la table et commandez sans faire la queue.",
      },
      {
        title: "À emporter",
        text: "Commandez depuis le site, passez récupérer au comptoir quand c'est prêt.",
      },
      {
        title: "Livraison",
        text: "Disponible autour de Kouba et de Chéraga. Les frais dépendent de l'adresse et vous sont confirmés avant l'envoi.",
      },
    ],
    questionTitle: "Une question, une remarque ?",
    questionText:
      "Appelez l'adresse la plus proche, ou écrivez-nous en message privé — on répond tous les jours pendant le service.",
    placeOrder: "Passer commande",
    directions: "Voir l'itinéraire",
    directionsLabel: "Voir l'itinéraire vers Niwa Food {name} sur Google Maps",
  },

  menu: {
    metaTitle: "Commander — Niwa Food",
    metaDescription:
      "Composez votre commande Niwa Food : sur place, à emporter ou en livraison à Kouba et Chéraga.",
    unavailableTitle: "Le menu est momentanément indisponible",
    unavailableText:
      "Rechargez la page dans un instant, ou appelez-nous directement.",
    eyebrow: "Notre carte",
    title: "Composez votre commande",
    lead: "Sur place, à emporter ou en livraison. Vous choisirez à la fin.",
    searchLabel: "Rechercher un plat",
    searchPlaceholder: "Un plat, un ingrédient...",
    clearSearch: "Effacer la recherche",
    cardTitle: "La carte",
    dishCount: plural({ one: "{count} plat", other: "{count} plats" }),
    removedTitle: plural({
      one: "Un article n'est plus disponible",
      other: "Des articles ne sont plus disponibles",
    }),
    removedText: plural({
      one: "{names} — retiré de votre panier.",
      other: "{names} — retirés de votre panier.",
    }),
    noResultTitle: "Rien ne correspond",
    noResultText:
      "Essayez un autre ingrédient, ou effacez la recherche pour parcourir toute la carte.",
    showAll: "Revoir tout le menu",
    results: plural({
      one: "{count} plat pour « {query} »",
      other: "{count} plats pour « {query} »",
    }),
    chooseOptions: "{name}, choisir les options",
    addToCart: "{name}, ajouter au panier",
    toCompose: "à composer",
  },

  storeClosed: {
    allTitle: "Commandes en ligne fermées",
    allText:
      "Nos restaurants ne prennent plus de commandes en ligne pour le moment. Vous pouvez consulter la carte, et nous appeler si besoin.",
    partialTitle: plural({
      one: "{stores} ne prend plus de commandes",
      other: "{stores} ne prennent plus de commandes",
    }),
    partialText: "Vous pouvez commander sur notre autre adresse.",
    and: " et ",
  },

  cart: {
    open: "Voir mon panier",
    openLabel: "Voir mon panier, {items}, {total}",
    title: "Votre commande",
    empty: "Votre panier est vide",
    emptyText: "Touchez un plat pour commencer.",
    removeOne: "Retirer un {name}",
    addOne: "Ajouter un {name}",
    remove: "Supprimer {name}",
    edit: "Modifier",
    editOrder: "Modifier ma commande",
    checkout: "Finaliser ma commande",
    nextStepHint:
      "Sur place, à emporter ou livraison — vous choisirez à l'étape suivante.",
    clear: "Vider",
  },

  product: {
    formula: "Formule",
    alone: "Seul",
    included: "Inclus : {items}",
    toChoose: "à choisir",
    noOption:
      "Aucune option disponible pour le moment. Choisissez une autre formule.",
    size: "Taille",
    fixedFormat: "Format unique en {formula} — pas de taille à choisir.",
    singleChoice: "un seul choix",
    remove: "Retirer",
    removeFromCart: "Retirer du panier",
    decrease: "Diminuer la quantité",
    increase: "Augmenter la quantité",
    chooseFirst: "Choisissez d'abord vos options",
    update: "Mettre à jour",
    add: "Ajouter",
  },

  checkout: {
    metaTitle: "Finaliser ma commande — Niwa Food",
    metaDescription:
      "Renseignez vos informations et envoyez votre commande Niwa Food.",
    lastStep: "Dernière étape",
    title: "Finaliser ma commande",
    closedTitle: "Commandes en ligne fermées",
    closedText:
      "Votre panier est conservé : vous pourrez l'envoyer dès la réouverture.",
    chooseOtherStore: "Choisissez notre autre adresse.",
    serviceTitle: "Comment souhaitez-vous être servi ?",
    hints: {
      dine_in: "Vous êtes installé en salle, on vous apporte votre commande.",
      takeaway: "Vous passez la récupérer au comptoir.",
      delivery: "On vous livre. Les frais seront calculés selon votre adresse.",
    },
    infoTitle: "Vos informations",
    name: "Votre nom",
    namePlaceholder: "Ex : Yacine",
    nameHint: "C'est le nom qui sera appelé pour votre commande.",
    table: "Votre table",
    chooseStoreFirst: "Choisissez d'abord un restaurant.",
    loadingTables: "Chargement des tables…",
    noTables:
      "Aucune table disponible ici. Choisissez « à emporter », ou demandez à un membre de l'équipe.",
    chooseTable: "Choisir une table",
    tableOption: "Table {number}",
    occupied: " — occupée",
    tableBusy:
      "Une commande est déjà en cours sur cette table : vos articles y seront ajoutés.",
    promoOnBusyTable:
      " Un code promo ne peut pas être ajouté à une commande déjà ouverte.",
    phone: "Téléphone",
    phoneHint: "Pour vous joindre si besoin.",
    address: "Adresse de livraison",
    addressPlaceholder: "Rue, immeuble, étage, repère…",
    remark: "Une précision ?",
    remarkPlaceholder: "Bien cuit, sonner deux fois…",
    deliveryFees:
      "Les frais de livraison dépendent de votre adresse : ils seront ajoutés par l'équipe et visibles sur votre suivi.",
    discountNotOnDelivery:
      " Votre remise porte sur les articles, pas sur la livraison.",
    promoHint:
      "Si le blocage vient de votre code promo, retirez-le ci-dessus : votre commande partira au tarif normal.",
    sending: "Envoi en cours…",
    closedButton: "Commandes momentanément fermées",
    send: "Envoyer ma commande",
    demoNotice:
      "Site de démonstration : votre commande apparaîtra dans le back-office de démo, mais elle ne sera ni préparée ni livrée.",
    liveNotice: "En envoyant, votre commande part directement en cuisine.",
    errors: {
      store: "Choisissez d'abord un restaurant",
      name: "Votre nom est requis",
      table: "Choisissez votre table",
      phone: "Un numéro de téléphone est requis (10 chiffres minimum)",
      address: "L'adresse de livraison est requise",
      send: "Impossible d'envoyer la commande. Réessayez dans un instant.",
    },
  },

  summary: {
    edit: "Modifier",
    subtotal: "Sous-total",
  },

  promo: {
    label: "Code promo",
    placeholder: "Ex : NIWA10",
    apply: "Appliquer",
    applied: "Code {code} appliqué",
    discount: "−{percent}% sur vos articles",
    saved: "{amount} économisés",
    remove: "Retirer le code promo",
    discountFallback: "Remise",
    errors: {
      empty: "Entrez votre code promo",
      invalid: "Ce code promo n'est pas valide",
      noLongerApplies: "Votre code promo ne s'applique plus à cette commande",
    },
  },

  lookup: {
    metaTitle: "Suivre ma commande — Niwa Food",
    metaDescription:
      "Entrez votre numéro de commande pour suivre sa préparation en direct.",
    eyebrow: "Suivi de commande",
    title: "Où en est ma commande ?",
    lead: "Entrez le numéro affiché au moment de votre commande, on vous montre où elle en est.",
    lastOrder: "Votre dernière commande",
    lastOrderNumber: "N° {number}",
    numberLabel: "Numéro de commande",
    numberPlaceholder: "Ex : 12",
    numberHint: "C'est le grand numéro affiché après validation de votre commande.",
    searching: "Recherche…",
    submit: "Voir ma commande",
    footnote:
      "Seules les commandes en cours de préparation ou de livraison sont consultables ici.",
    help: "Un souci ? Appelez-nous",
    errors: {
      store: "Choisissez d'abord votre restaurant",
      number: "Entrez le numéro figurant sur votre commande",
      failed: "Impossible de retrouver cette commande pour le moment.",
    },
  },

  tracking: {
    metaTitle: "Suivi de commande — Niwa Food",
    notFoundTitle: "Commande introuvable",
    notFoundText: "Elle a peut-être été supprimée, ou le lien est incomplet.",
    searchByNumber: "Chercher par numéro",
    order: "Commande",
    placedAt: "passée à {time}",
    live: "Suivi en direct",
    polling: "Actualisation automatique",
    cancelledTitle: "Commande annulée",
    cancelledText:
      "Contactez le restaurant si vous pensez qu'il s'agit d'une erreur.",
    details: "Le détail",
    remark: "Votre précision : ",
    deliveryFee: "Livraison",
    toConfirm: "à confirmer",
    progressTitle: "Où en est votre commande",
    waiting: "En attente",
    orderMore: "Commander autre chose",
    keepOpen: "Gardez cette page ouverte, elle se met à jour toute seule.",
    // Une étape par statut, et des étapes différentes selon le mode : une
    // commande à emporter ne passe jamais par « En route ».
    steps: {
      dine_in: {
        pending: { label: "Commande reçue", hint: "C'est en préparation." },
        ready: { label: "Prête", hint: "On vous l'apporte à table." },
        completed: { label: "Servie", hint: "Bon appétit !" },
      },
      takeaway: {
        pending: { label: "Commande reçue", hint: "C'est en préparation." },
        ready: {
          label: "Prête à récupérer",
          hint: "Présentez-vous au comptoir.",
        },
        completed: { label: "Récupérée", hint: "Bon appétit !" },
      },
      delivery: {
        pending: { label: "Commande reçue", hint: "C'est en préparation." },
        ready: { label: "Prête", hint: "Elle part bientôt." },
        out_for_delivery: { label: "En route", hint: "Le livreur est parti." },
        completed: { label: "Livrée", hint: "Bon appétit !" },
      },
    },
  },

  notFound: {
    metaTitle: "Page introuvable — Niwa Food",
    title: "Cette page n'est pas sur la carte",
    text: "Le lien est peut-être erroné, ou la page a été déplacée. Le menu, lui, est toujours là.",
    home: "Retour à l'accueil",
  },
};

export type Dictionary = typeof fr;
