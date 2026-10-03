// src/components/public/HowItWorks.tsx

// src/components/public/HowItWorks.tsx

const STEPS = [
  {
    icon: "icon-[mdi--silverware-fork-knife]",
    title: "Choisissez",
    description:
      "Parcourez notre menu et composez votre commande : burgers, tacos, pizzas ou salades.",
  },
  {
    icon: "icon-[mdi--cart-check]",
    title: "Commandez",
    description:
      "Sur place, à emporter ou en livraison à domicile — vous choisissez ce qui vous arrange.",
  },
  {
    icon: "icon-[mdi--chef-hat]",
    title: "On prépare",
    description:
      "Chaque plat est préparé minute dans nos cuisines, jamais à l'avance.",
  },
  {
    icon: "icon-[mdi--moped]",
    title: "Récupérez",
    description:
      "Récupérez sur place ou faites-vous livrer directement chez vous, encore chaud.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="comment-ca-marche"
      className="relative isolate overflow-hidden px-2 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-6xl rounded-4xl background dark:bg-primary/30 px-4 py-8 shadow-[0_0_25px_5px_rgba(217,169,77,0.45)] shadow-primary/30 backdrop-blur-md sm:px-8 sm:py-12 border border-primary">
        <div className="mb-10 flex flex-col items-center gap-2 text-center sm:mb-14">
          <span className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-foreground/70">
            En quatre temps
          </span>
          <h2 className="font-heading text-3xl font-bold text-accent-green sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mx-auto max-w-md text-sm text-foreground">
            De votre écran à votre table, en quatre étapes.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <div
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-14 hidden border-t border-dashed border-accent-green/50 lg:block"
          />
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="group relative z-10 flex flex-col items-center gap-3 rounded-3xl border border-primary bg-background p-6 text-center shadow-food-sm transition-all duration-300 motion-safe:hover:-translate-y-1.5 hover:shadow-[0_0_20px_5px_rgba(217,169,77,0.45)] hover:shadow-primary cursor-pointer"
            >
              <span className="absolute right-4 top-4 font-heading text-xs font-bold tracking-widest text-accent-green/70">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className={`${step.icon} text-4xl text-accent-green`} />

              <h3 className="font-heading text-lg font-bold text-foreground">
                {step.title}
              </h3>

              <p className="text-sm leading-relaxed text-foreground/80">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
