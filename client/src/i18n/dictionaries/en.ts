import type { Dictionary } from "./fr";

/**
 * Textes du site public, en anglais.
 *
 * Mêmes clés que fr.ts, imposées par le type Dictionary.
 */
export const en: Dictionary = {
  meta: {
    title: "Niwa Food — Homemade burgers, tacos and pizzas in Kouba and Chéraga",
    description:
      "Homemade fast food in Algiers: burgers, tacos and pizzas made to order. Dine in, take away or delivered in Kouba and Chéraga.",
    ogLocale: "en_US",
  },

  common: {
    close: "Close",
    optional: "optional",
    retry: "Try again",
    seeNumbers: "See our phone numbers",
    backToMenu: "Back to the menu",
    order: "Order",
    seeMenu: "See the menu",
    total: "Total",
    itemsTotal: "Items",
    from: "from",
    perUnit: "{price} each",
    without: "no",
    items: { one: "{count} item", other: "{count} items" },
    whichStore: "Which restaurant?",
    closed: "Closed",
    loading: "Loading…",
  },

  stores: {
    kouba: {
      name: "Kouba",
      address: "Parc Ben Omar",
      addressDetail: "Kouba, Algiers",
    },
    cheraga: {
      name: "Chéraga",
      address: "Chéraga",
      addressDetail: "West Algiers",
    },
  },

  hours: {
    title: "Opening hours",
    saturdayToThursday: "Saturday to Thursday",
    friday: "Friday",
  },

  orderTypes: {
    dine_in: "Dine in",
    takeaway: "Takeaway",
    delivery: "Delivery",
  },

  socialLabel: "Niwa Food on {network}",
  facadeAlt: "Front of the Niwa Food restaurant in {name}",

  demoBanner: {
    short: "Demo site: orders are not sent to the restaurant.",
    long: "Demo website: orders are not sent to the restaurant.",
    author: "A personal project by Mehdi Abdi, not affiliated with Niwa Food.",
  },

  nav: {
    home: "Home",
    menu: "Menu",
    tracking: "Tracking",
    trackingLong: "Order tracking",
    about: "About",
    contact: "Contact",
    openMenu: "Open the menu",
    closeMenu: "Close the menu",
    toggleTheme: "Toggle light/dark theme",
    language: "Language",
    cart: "View my cart, {items}",
    trackOrder: "Track my order number {number}",
  },

  footer: {
    tagline:
      "Burgers, tacos and pizzas made to order, 100% homemade. Dine in, take away, or delivered to your door.",
    navigation: "Navigation",
    addresses: "Our locations",
    hungry: "Hungry?",
    hungryText: "Build your order in a few clicks.",
    rights: "© {year} Niwa Food — All rights reserved",
    credit: "Built by Mehdi Abdi",
  },

  hero: {
    headline: ["Burgers,", "tacos", "and pizzas,", "made to order."],
    lead: "Prepared when you order, in our kitchens in Kouba and Chéraga. Dine in, take away or delivered to your door.",
    addresses: "Our two locations",
    carouselRole: "carousel",
    carouselLabel: "A few dishes from the menu",
    previous: "Previous dish",
    next: "Next dish",
    slides: [
      { alt: "Niwa Food burger", label: "Juicy burger, toasted bun" },
      { alt: "Niwa Food tacos", label: "Generous tacos, signature sauce" },
      { alt: "Niwa Food pizza", label: "Homemade pizza, fresh dough" },
      { alt: "Niwa Food fries", label: "Crispy golden fries" },
      { alt: "Niwa Food Caesar salad", label: "Caesar salad, crisp and fresh" },
    ],
  },

  bands: {
    menu: [
      "Burgers",
      "Cheesy tacos",
      "Homemade pizzas",
      "Homemade fries",
      "Made to order",
    ],
    service: ["Kouba", "Chéraga", "Dine in", "Takeaway", "Delivery"],
  },

  bestSellers: {
    title: "Most ordered",
    lead: "The recipes our customers come back for again and again.",
    seeAll: "See the full menu",
    loading: "Loading best sellers...",
    error: "The menu can't be loaded right now.",
    previous: "Previous products",
    next: "Next products",
    carouselLabel: "Best sellers carousel",
  },

  howItWorks: {
    title: "From your screen to your table",
    lead: "Four steps, and your order arrives still hot.",
    step: "Step {number}",
    steps: [
      {
        title: "Choose",
        description:
          "Browse our menu and build your order: burgers, tacos, pizzas or salads.",
      },
      {
        title: "Order",
        description:
          "Dine in, take away or home delivery: you pick what suits you.",
      },
      {
        title: "We cook",
        description:
          "Every dish is made to order in our kitchens, never in advance.",
      },
      {
        title: "Enjoy",
        description:
          "Pick it up at the restaurant or get it delivered to your door, still hot.",
      },
    ],
  },

  homeAbout: {
    title: "Handcrafted burgers are our specialty",
    paragraphs: [
      "At Niwa Food, it all starts with a simple idea: make every burger, tacos and pizza as if it were the first. Bun toasted on the spot, fresh meat, homemade sauces. Nothing is made in advance and left waiting.",
      "From our kitchens in Kouba and Chéraga, we feed everyone who wants to eat fast without giving up on taste: dine in, take away, or delivered straight to your door.",
    ],
    pauseVideo: "Pause the video",
    playVideo: "Play the video",
    addresses: "locations in Algiers",
    homemade: "homemade",
    open: "open",
    daysPerWeek: "{days}/7",
  },

  testimonials: {
    title: "What our regulars say",
    demoNotice: "Sample reviews for the demo, not real customers",
    lead: "Experiences shared after a visit to Niwa Food.",
    pause: "Pause the reviews",
    resume: "Resume the reviews",
    rating: "{rating} out of 5 stars",
    texts: [
      "The PIRELLI burger has become my Friday night ritual. Toasted bun, juicy meat, nothing to fault. Delivery took 25 minutes on the dot.",
      "We ordered for the whole family on a Sunday, tacos and pizza. Everything arrived hot and well packed. The kids loved the Niwa fries.",
      "Great value for money. I ate in, and the service was quick even at rush hour. A small wait on a Friday night, otherwise nothing to complain about.",
      "The Caesar salad is really fresh, unlike some fast-food places that make it the day before. You can tell it's made to order.",
      "A regular since the opening. The homemade sauce on the GILERA tacos is unique, I haven't found it anywhere else in Algiers.",
      "Good pizza, thin and crispy crust. We ordered takeaway and it was ready in 15 minutes as promised. I recommend it.",
    ],
  },

  homeContact: {
    title: "Two locations in Algiers",
    lead: "Same menu, same hours, two kitchens.",
    directions: "Directions",
    directionsLabel: "Directions to Niwa Food {name} on Google Maps",
  },

  aboutPage: {
    metaTitle: "About — Niwa Food",
    metaDescription:
      "Handcrafted burgers, tacos and pizzas made to order in Kouba and Chéraga. A menu named after legends of the road.",
    ogDescription:
      "Handcrafted burgers, made to order. Two locations in Algiers, a menu named like a garage.",
    eyebrow: "Our story",
    titleStart: "Our menu reads",
    titleHighlight: "like a garage",
    lead: "Niwa Food is a homemade fast-food restaurant, born in Kouba and now also in Chéraga. Our specialty comes down to two words: handcrafted burgers.",
    storyTitle: "It all starts with a simple idea",
    story: [
      "Make every burger, every tacos and every pizza as if it were the first of the day. Nothing is put together in advance to be reheated later: when you order, we start.",
      "The rest is a matter of temperament. We love two-wheelers, so our dishes carry their names. A TMAX, a MALOSSI, a VESPA — not just for show, but because it's the house vocabulary, and our regulars now order by plate rather than by ingredient.",
    ],
    decoderEyebrow: "The decoder",
    decoderTitle: "Where the names come from",
    decoderLead:
      "Each dish pays tribute to a name from the world of scooters and motorcycles. Here is the translation.",
    garage: {
      TMAX: "Yamaha's maxi-scooter",
      NMAX: "Its little brother, more nimble",
      VESPA: "The Italian that started it all",
      GILERA: "Italian motorcycle maker",
      POLINI: "Italian engine tuner",
      MALOSSI: "Performance parts for scooters",
      GIVI: "Luggage and top cases",
      ARAI: "The Japanese helmets",
      "J-COSTA": "Transmission variators",
    },
    methodEyebrow: "In the kitchen",
    methodTitle: "What we refuse to do",
    method: [
      {
        title: "Buns, toasted on the spot",
        text: "No burger waits under a heat lamp. The bun goes on the grill the moment the order comes in, not before.",
      },
      {
        title: "Sauces, made here",
        text: "American, oriental, white sauce: they come out of our kitchen, not a jar. That's what gives a burger a taste you won't find elsewhere.",
      },
      {
        title: "Meat, never in advance",
        text: "Fresh ground beef, seared to order. Meat cooked ahead loses its juice in ten minutes — we don't take that shortcut.",
      },
      {
        title: "Delivered while it's hot",
        text: "Dine in, take away or delivered around Kouba and Chéraga. The delivery area is short on purpose: any further, it's not the same dish that arrives.",
      },
    ],
    figures: {
      addresses: "locations in Algiers",
      openValue: "7/7",
      open: "open, from 6 pm on Fridays",
      followers: "followers on Instagram",
      homemade: "homemade",
    },
    ctaTitle: "The rest is for tasting",
    ctaText:
      "Build your order in a few minutes: dine in, take away or delivery.",
    ctaAddresses: "Our locations",
  },

  contactPage: {
    metaTitle: "Contact us — Niwa Food",
    metaDescription:
      "Niwa Food in Kouba (0552 52 00 76) and Chéraga (0549 18 97 27). Open 11 am to 12:30 am, Fridays from 6 pm. Dine in, take away or delivery.",
    ogDescription:
      "Two locations in Algiers, open until 12:30 am. Dine in, take away or delivery.",
    eyebrow: "Find us",
    titleStart: "Two locations,",
    titleHighlight: "one treat",
    lead: "Kouba and Chéraga, open every day until 12:30 am. One call is enough to order, and the website does the rest.",
    hoursTitle: "Opening hours",
    hoursNote: "The same at both locations.",
    howEyebrow: "How to order",
    howTitle: "Three ways to eat with us",
    modes: [
      {
        title: "Dine in",
        text: "Take a seat, scan the QR code on the table and order without queuing.",
      },
      {
        title: "Takeaway",
        text: "Order on the website, then pick it up at the counter when it's ready.",
      },
      {
        title: "Delivery",
        text: "Available around Kouba and Chéraga. Fees depend on the address and are confirmed before dispatch.",
      },
    ],
    questionTitle: "A question, a comment?",
    questionText:
      "Call the nearest location, or send us a private message — we reply every day during service.",
    placeOrder: "Place an order",
    directions: "Get directions",
    directionsLabel: "Get directions to Niwa Food {name} on Google Maps",
  },

  menu: {
    metaTitle: "Order — Niwa Food",
    metaDescription:
      "Build your Niwa Food order: dine in, take away or delivery in Kouba and Chéraga.",
    unavailableTitle: "The menu is temporarily unavailable",
    unavailableText: "Reload the page in a moment, or call us directly.",
    eyebrow: "Our menu",
    title: "Build your order",
    lead: "Dine in, take away or delivery. You'll choose at the end.",
    searchLabel: "Search for a dish",
    searchPlaceholder: "A dish, an ingredient...",
    clearSearch: "Clear the search",
    cardTitle: "The menu",
    dishCount: { one: "{count} dish", other: "{count} dishes" },
    removedTitle: {
      one: "An item is no longer available",
      other: "Some items are no longer available",
    },
    removedText: {
      one: "{names} — removed from your cart.",
      other: "{names} — removed from your cart.",
    },
    noResultTitle: "Nothing matches",
    noResultText:
      "Try another ingredient, or clear the search to browse the whole menu.",
    showAll: "Show the whole menu",
    results: {
      one: "{count} dish for “{query}”",
      other: "{count} dishes for “{query}”",
    },
    chooseOptions: "{name}, choose options",
    addToCart: "{name}, add to cart",
    toCompose: "customizable",
  },

  storeClosed: {
    allTitle: "Online ordering is closed",
    allText:
      "Our restaurants aren't taking online orders right now. You can still browse the menu, and call us if needed.",
    partialTitle: {
      one: "{stores} is no longer taking orders",
      other: "{stores} are no longer taking orders",
    },
    partialText: "You can order from our other location.",
    and: " and ",
  },

  cart: {
    open: "View my cart",
    openLabel: "View my cart, {items}, {total}",
    title: "Your order",
    empty: "Your cart is empty",
    emptyText: "Tap a dish to get started.",
    removeOne: "Remove one {name}",
    addOne: "Add one {name}",
    remove: "Delete {name}",
    edit: "Edit",
    editOrder: "Edit my order",
    checkout: "Checkout",
    nextStepHint:
      "Dine in, takeaway or delivery — you'll choose at the next step.",
    clear: "Clear",
  },

  product: {
    formula: "Meal deal",
    alone: "On its own",
    included: "Includes: {items}",
    toChoose: "required",
    noOption: "No option available right now. Choose another meal deal.",
    size: "Size",
    fixedFormat: "Single size with {formula} — no size to choose.",
    singleChoice: "choose one",
    remove: "Remove",
    removeFromCart: "Remove from cart",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    chooseFirst: "Choose your options first",
    update: "Update",
    add: "Add",
  },

  checkout: {
    metaTitle: "Checkout — Niwa Food",
    metaDescription: "Enter your details and send your Niwa Food order.",
    lastStep: "Last step",
    title: "Checkout",
    closedTitle: "Online ordering is closed",
    closedText: "Your cart is saved: you can send it as soon as we reopen.",
    chooseOtherStore: "Choose our other location.",
    serviceTitle: "How would you like to be served?",
    hints: {
      dine_in: "You're seated in the restaurant, we'll bring your order to you.",
      takeaway: "You pick it up at the counter.",
      delivery: "We deliver it. Fees are calculated based on your address.",
    },
    infoTitle: "Your details",
    name: "Your name",
    namePlaceholder: "E.g. Yacine",
    nameHint: "This is the name we'll call out for your order.",
    table: "Your table",
    chooseStoreFirst: "Choose a restaurant first.",
    loadingTables: "Loading tables…",
    noTables:
      "No table available here. Choose “takeaway”, or ask a member of the team.",
    chooseTable: "Choose a table",
    tableOption: "Table {number}",
    occupied: " — occupied",
    tableBusy:
      "An order is already open on this table: your items will be added to it.",
    promoOnBusyTable: " A promo code can't be added to an order that's already open.",
    phone: "Phone",
    phoneHint: "So we can reach you if needed.",
    address: "Delivery address",
    addressPlaceholder: "Street, building, floor, landmark…",
    remark: "Anything to add?",
    remarkPlaceholder: "Well done, ring twice…",
    deliveryFees:
      "Delivery fees depend on your address: the team adds them and you'll see them on your tracking page.",
    discountNotOnDelivery: " Your discount applies to the items, not to delivery.",
    promoHint:
      "If your promo code is the problem, remove it above: your order will go through at the regular price.",
    sending: "Sending…",
    closedButton: "Ordering temporarily closed",
    send: "Send my order",
    demoNotice:
      "Demo website: your order will show up in the demo back office, but it won't be prepared or delivered.",
    liveNotice: "Once sent, your order goes straight to the kitchen.",
    errors: {
      store: "Choose a restaurant first",
      name: "Your name is required",
      table: "Choose your table",
      phone: "A phone number is required (at least 10 digits)",
      address: "The delivery address is required",
      send: "The order couldn't be sent. Please try again in a moment.",
    },
  },

  summary: {
    edit: "Edit",
    subtotal: "Subtotal",
  },

  promo: {
    label: "Promo code",
    placeholder: "E.g. NIWA10",
    apply: "Apply",
    applied: "Code {code} applied",
    discount: "−{percent}% on your items",
    saved: "{amount} saved",
    remove: "Remove the promo code",
    discountFallback: "Discount",
    errors: {
      empty: "Enter your promo code",
      invalid: "This promo code isn't valid",
      noLongerApplies: "Your promo code no longer applies to this order",
    },
  },

  lookup: {
    metaTitle: "Track my order — Niwa Food",
    metaDescription: "Enter your order number to follow its preparation live.",
    eyebrow: "Order tracking",
    title: "Where's my order?",
    lead: "Enter the number shown when you placed your order, and we'll show you where it's at.",
    lastOrder: "Your latest order",
    lastOrderNumber: "No. {number}",
    numberLabel: "Order number",
    numberPlaceholder: "E.g. 12",
    numberHint: "It's the big number shown after your order was confirmed.",
    searching: "Searching…",
    submit: "See my order",
    footnote: "Only orders being prepared or delivered can be looked up here.",
    help: "A problem? Call us",
    errors: {
      store: "Choose your restaurant first",
      number: "Enter the number shown on your order",
      failed: "This order can't be found right now.",
    },
  },

  tracking: {
    metaTitle: "Order tracking — Niwa Food",
    notFoundTitle: "Order not found",
    notFoundText: "It may have been deleted, or the link is incomplete.",
    searchByNumber: "Search by number",
    order: "Order",
    placedAt: "placed at {time}",
    live: "Live tracking",
    polling: "Auto-refresh",
    cancelledTitle: "Order cancelled",
    cancelledText: "Contact the restaurant if you think this is a mistake.",
    details: "Details",
    remark: "Your note: ",
    deliveryFee: "Delivery",
    toConfirm: "to be confirmed",
    progressTitle: "Where your order is at",
    waiting: "Waiting",
    orderMore: "Order something else",
    keepOpen: "Keep this page open, it updates on its own.",
    steps: {
      dine_in: {
        pending: { label: "Order received", hint: "It's being prepared." },
        ready: { label: "Ready", hint: "We're bringing it to your table." },
        completed: { label: "Served", hint: "Enjoy your meal!" },
      },
      takeaway: {
        pending: { label: "Order received", hint: "It's being prepared." },
        ready: { label: "Ready for pickup", hint: "Come to the counter." },
        completed: { label: "Picked up", hint: "Enjoy your meal!" },
      },
      delivery: {
        pending: { label: "Order received", hint: "It's being prepared." },
        ready: { label: "Ready", hint: "It's leaving soon." },
        out_for_delivery: {
          label: "On the way",
          hint: "The rider is on their way.",
        },
        completed: { label: "Delivered", hint: "Enjoy your meal!" },
      },
    },
  },

  notFound: {
    metaTitle: "Page not found — Niwa Food",
    title: "This page isn't on the menu",
    text: "The link may be wrong, or the page has moved. The menu, though, is still here.",
    home: "Back to home",
  },
};
