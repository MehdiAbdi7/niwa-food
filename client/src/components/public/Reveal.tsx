"use client";

import { Children, isValidElement } from "react";
import { useReveal } from "@/features/reveal/useReveal";

interface RevealProps {
  children: React.ReactNode;
  /**
   * Anime les ENFANTS DIRECTS en cascade plutôt que le bloc entier.
   * C'est le mode à privilégier : révéler un conteneur de 600px de haut d'un
   * seul tenant produit un décalage, pas un mouvement. Révéler son surtitre,
   * puis son titre, puis son contenu produit une lecture.
   */
  stagger?: boolean;
  /** Écart entre deux enfants en mode cascade, en ms. */
  staggerStep?: number;
  /** Retard avant le départ, en ms. */
  delay?: number;
  /** Durée de la transition, en ms. */
  duration?: number;
  className?: string;
}

// État d'arrivée. Pas de constante symétrique pour l'état masqué : celui-ci
// porte un préfixe motion-safe: sur le déplacement mais pas sur l'opacité —
// un visiteur qui a demandé la réduction des animations doit recevoir un
// fondu simple, jamais un contenu figé décalé.
const SHOWN = "translate-y-0 opacity-100";

// Déplacement vertical court plutôt qu'un glissement latéral : sur un bloc
// pleine largeur, 40px horizontaux se lisent comme un saut de mise en page.
//
// PAS de blur ici, malgré l'effet de mise au point qu'il donnait : animer
// `filter: blur()` force une re-rastérisation de toute la surface à chaque
// frame. Sur nos sections — 600px de haut, ombres portées, backdrop-blur-md
// sur la carte et backdrop-blur-2xl sur chaque produit — le coût dépasse le
// budget d'une frame et l'animation saccade. Seuls opacity et transform sont
// composités par le GPU sans repeindre.
const HIDDEN_MOTION_SAFE = "opacity-0 motion-safe:translate-y-3.5";

// Courbe légèrement débordante : le contenu dépasse d'un cheveu sa position
// finale avant de se poser. C'est ce qui distingue une apparition d'un fondu.
const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

// La liste des propriétés est explicite, jamais `transition-all` : celui-ci
// surveillerait aussi les ombres et les couleurs, que le survol des cartes
// modifie — deux animations se marcheraient dessus.
const TRANSITION = "transition-[opacity,transform]";

/**
 * Révèle son contenu à l'entrée dans le viewport.
 *
 * Transition CSS sur opacity + transform plutôt qu'une @keyframes : l'état de
 * départ doit rester appliqué tant que l'élément n'est pas visible, ce qu'une
 * animation déclenchée au montage ne permet pas.
 *
 * duration et delay passent par le style inline : les classes Tailwind sont
 * générées à la compilation, donc une valeur arbitraire passée en prop ne
 * produirait aucune classe.
 */
export function Reveal({
  children,
  stagger = false,
  staggerStep = 110,
  delay = 0,
  duration = 900,
  className = "",
}: RevealProps) {
  const { ref, isRevealed } = useReveal();

  const stateClasses = isRevealed ? SHOWN : HIDDEN_MOTION_SAFE;

  // will-change n'est posé que PENDANT l'animation. Le laisser en permanence
  // maintiendrait chaque section sur sa propre couche de composition pour
  // toute la vie de la page — coûteux en mémoire, et contre-productif : le
  // navigateur a moins de couches à gérer une fois l'animation finie.
  const layerStyle = isRevealed ? undefined : ("opacity, transform" as const);

  if (!stagger) {
    return (
      <div
        ref={ref}
        className={`${TRANSITION} ${stateClasses} ${className}`}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: `${delay}ms`,
          transitionTimingFunction: EASING,
          willChange: layerStyle,
        }}
      >
        {children}
      </div>
    );
  }

  // En cascade, chaque enfant direct reçoit son propre délai. On enveloppe
  // plutôt que de cloner : cloneElement écraserait le className de l'enfant,
  // et beaucoup des nôtres en dépendent (grilles, flex).
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div ref={ref} className={className}>
      {items.map((child, index) => (
        <div
          key={index}
          className={`${TRANSITION} ${stateClasses}`}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${delay + index * staggerStep}ms`,
            transitionTimingFunction: EASING,
            willChange: layerStyle,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
