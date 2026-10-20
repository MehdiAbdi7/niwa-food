"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "@/features/motion/useReducedMotion";
import { useScrollProgress } from "@/features/motion/useScrollProgress";
import { useI18n } from "@/i18n/I18nProvider";
import { fill } from "@/i18n/text";

// Une icône par étape, dans l'ordre de dict.howItWorks.steps.
const STEP_ICONS = [
  "icon-[mdi--silverware-fork-knife]",
  "icon-[mdi--cart-check]",
  "icon-[mdi--chef-hat]",
  "icon-[mdi--moped]",
];

// Amplitude des virages de la route entre deux étapes, en px.
const ROAD_WAVE_PX = 28;
// Points relevés le long de la route pour situer chaque étape dessus.
const ROAD_SAMPLES = 200;
// Inclinaison maximale du scooter dans les virages.
const MAX_LEAN_DEG = 22;

interface Point {
  x: number;
  y: number;
}

/**
 * Trace une route qui passe par le centre de chaque pastille, en ondulant :
 * chaque tronçon est une courbe de Bézier dont les deux points de contrôle
 * sont décalés du même côté, un coup à gauche, un coup à droite.
 */
function buildRoad(points: Point[], horizontal: boolean): string {
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const side = i % 2 === 0 ? -1 : 1;
    const wave = side * ROAD_WAVE_PX;

    if (horizontal) {
      const dx = to.x - from.x;
      path += ` C ${from.x + dx * 0.35} ${from.y + wave}, ${from.x + dx * 0.65} ${to.y + wave}, ${to.x} ${to.y}`;
    } else {
      const dy = to.y - from.y;
      path += ` C ${from.x + wave} ${from.y + dy * 0.35}, ${to.x + wave} ${from.y + dy * 0.65}, ${to.x} ${to.y}`;
    }
  }

  return path;
}

/**
 * Les quatre étapes reliées par une route que le défilement dessine.
 *
 * Un scooter roule sur la route à mesure qu'on descend, et chaque étape
 * s'allume quand il l'atteint. La route est calculée à partir de la position
 * RÉELLE des pastilles : elle suit la grille quelle qu'elle soit, en ligne
 * sur ordinateur, en colonne sur téléphone.
 *
 * Tout passe par des refs et des écritures directes dans le DOM : le
 * défilement met à jour la route à chaque image, un state React relancerait
 * le rendu de la section autant de fois.
 *
 * En arabe, la grille se lit de droite à gauche : la route part de la
 * pastille de droite et le scooter se retourne tout seul, puisque tout est
 * calculé sur les positions mesurées.
 */
export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();
  const { dict } = useI18n();

  const listRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const traceRef = useRef<SVGPathElement>(null);
  const scooterRef = useRef<HTMLDivElement>(null);

  const roadLength = useRef(0);
  // Fraction de la route (0 à 1) où se trouve chaque étape.
  const stepFractions = useRef<number[]>([]);
  // Avancement courant, gardé pour redessiner après un redimensionnement.
  const progressRef = useRef(0);

  const render = useCallback((progress: number) => {
    progressRef.current = progress;
    const trace = traceRef.current;
    const scooter = scooterRef.current;
    const list = listRef.current;
    const length = roadLength.current;
    if (!trace || !scooter || !list || length === 0) return;

    // pathLength={1} sur le tracé : 0 le montre entier, 1 le cache.
    trace.style.strokeDashoffset = String(1 - progress);

    const distance = progress * length;
    const here = trace.getPointAtLength(distance);
    // Direction de la route au point courant, mesurée juste devant (ou
    // juste derrière en bout de route).
    const near = trace.getPointAtLength(
      distance < length - 2 ? distance + 2 : distance - 2,
    );
    const sign = distance < length - 2 ? 1 : -1;
    const dx = (near.x - here.x) * sign;
    const dy = (near.y - here.y) * sign;

    // Le scooter penche dans les virages sans jamais basculer, et se
    // retourne s'il roule vers la gauche.
    const lean = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
    const clampedLean = Math.max(-MAX_LEAN_DEG, Math.min(MAX_LEAN_DEG, lean));
    const flip = dx < -0.01 ? -1 : 1;
    scooter.style.transform = `translate(${here.x}px, ${here.y}px) translate(-50%, -78%) rotate(${clampedLean * flip}deg) scaleX(${flip})`;

    list.querySelectorAll<HTMLElement>(".road-step").forEach((step, index) => {
      const reached = progress >= (stepFractions.current[index] ?? 1) - 0.01;
      step.classList.toggle("is-active", reached);
    });
  }, []);

  // Tracé de la route : à l'approche de la section, puis à chaque changement
  // de taille de la liste (rotation du téléphone, police chargée, passage en
  // colonne).
  useEffect(() => {
    const list = listRef.current;
    const svg = svgRef.current;
    const road = roadRef.current;
    const trace = traceRef.current;
    const scooter = scooterRef.current;
    if (!list || !svg || !road || !trace || !scooter) return;

    const layout = () => {
      const listRect = list.getBoundingClientRect();
      const dots = list.querySelectorAll<HTMLElement>("[data-road-dot]");
      const points = Array.from(dots, (dot) => {
        const rect = dot.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - listRect.left,
          y: rect.top + rect.height / 2 - listRect.top,
        };
      });
      if (points.length < 2) return;

      const first = points[0];
      const last = points[points.length - 1];
      const horizontal =
        Math.abs(last.x - first.x) > Math.abs(last.y - first.y);

      // viewBox aux dimensions exactes de la liste : une unité SVG vaut un
      // pixel, la route tombe pile sur les pastilles et le trait garde son
      // épaisseur.
      svg.setAttribute("viewBox", `0 0 ${listRect.width} ${listRect.height}`);
      const path = buildRoad(points, horizontal);
      road.setAttribute("d", path);
      trace.setAttribute("d", path);
      roadLength.current = trace.getTotalLength();

      // Situe chaque pastille sur la route : le point échantillonné le plus
      // proche de son centre. Les étapes n'ont pas toutes la même hauteur
      // en colonne, leurs écarts sur la route ne sont donc pas égaux.
      const samples = Array.from({ length: ROAD_SAMPLES + 1 }, (_, i) =>
        trace.getPointAtLength((i / ROAD_SAMPLES) * roadLength.current),
      );
      stepFractions.current = points.map((point) => {
        let best = 0;
        let bestDistance = Infinity;
        samples.forEach((sample, i) => {
          const d = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
          if (d < bestDistance) {
            bestDistance = d;
            best = i;
          }
        });
        return best / ROAD_SAMPLES;
      });

      scooter.style.opacity = "1";
      render(progressRef.current);
    };

    // Le tracé coûte : mesure des pastilles (qui force un calcul de mise en
    // page) et 200 points relevés sur la route. Fait au montage, il pesait
    // sur le chargement de l'accueil pour une section loin sous la ligne de
    // flottaison. Il attend donc que la section approche (un écran avant).
    const resizeObserver = new ResizeObserver(layout);
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        resizeObserver.observe(list);
        nearObserver.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    nearObserver.observe(list);

    return () => {
      nearObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [render]);

  // Animations réduites : la route est tracée d'emblée, toutes les étapes
  // sont allumées et le scooter attend à l'arrivée.
  useEffect(() => {
    if (prefersReducedMotion) render(1);
  }, [prefersReducedMotion, render]);

  useScrollProgress(listRef, render, {
    start: 0.85,
    end: 0.6,
    enabled: !prefersReducedMotion,
  });

  return (
    <section id="comment-ca-marche" className="px-4 sm:px-8">
      {/* Le conteneur d'origine : fond du hero (.background, clair ou
          sombre), bordure primary et halo doré. */}
      <div className="mx-auto max-w-6xl rounded-4xl border border-primary background px-5 py-12 text-foreground shadow-[0_0_25px_5px_rgba(217,169,77,0.45)] shadow-primary/30 sm:px-10 sm:py-16 dark:bg-primary/30">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.01em] sm:text-6xl">
            {dict.howItWorks.title}
          </h2>
          <p className="mt-3 max-w-md text-base text-foreground/80 sm:text-lg">
            {dict.howItWorks.lead}
          </p>

          {/* La route et le scooter vivent à côté de la liste et non dedans :
              un <ol> ne doit contenir que des <li>. */}
          <div ref={listRef} className="relative mt-12 md:mt-20">
            <svg
              ref={svgRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            >
              {/* La route, en pointillés discrets... */}
              <path
                ref={roadRef}
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="2 12"
                className="text-foreground/30"
              />
              {/* ...et le trajet parcouru, plein, par-dessus. */}
              <path
                ref={traceRef}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1}
              />
            </svg>

            {/* Le scooter : invisible jusqu'au premier tracé, sinon il
                attendrait dans le coin haut gauche de la liste. Sous les
                étapes (z-0 contre z-10) : en colonne, la route passe au
                centre des pastilles, et le scooter les traverse au lieu de
                masquer leur icône. */}
            <div
              ref={scooterRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 z-0 text-5xl text-primary opacity-0 drop-shadow-[0_4px_0_rgb(0_0_0/0.25)]"
            >
              <span className="icon-[mdi--moped] block" />
            </div>

            <ol className="grid gap-12 md:grid-cols-4 md:gap-6">
              {dict.howItWorks.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="road-step relative z-10 flex gap-5 md:flex-col md:items-center md:text-center"
                >
                  {/* Fond plein : la route semble entrer dans la pastille au
                      lieu de la traverser. */}
                  <span
                    data-road-dot
                    className="road-dot flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-primary/60 bg-background text-primary"
                  >
                    <span
                      aria-hidden="true"
                      className={`${STEP_ICONS[index]} text-3xl`}
                    />
                  </span>

                  <div className="pt-1 md:pt-3">
                    {/* Masqué aux lecteurs d'écran : la liste numérotée
                        annonce déjà le rang. */}
                    <p
                      aria-hidden="true"
                      className="font-heading text-sm font-bold text-foreground/75"
                    >
                      {fill(dict.howItWorks.step, { number: index + 1 })}
                    </p>
                    <h3 className="font-heading text-2xl font-bold leading-tight">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 max-w-xs leading-relaxed text-foreground/80 md:mx-auto">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
