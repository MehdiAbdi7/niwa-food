/**
 * Effets qui suivent la souris, posés en variables CSS sur l'élément survolé.
 *
 * Fonctions et non hooks : il n'y a rien à mémoriser entre deux événements,
 * tout est relu sur l'élément. Le CSS fait le reste (globals.css, .tilt-card
 * et .spotlight), et c'est lui qui coupe l'effet quand les animations sont
 * réduites ou que l'écran est tactile.
 *
 * Souris uniquement : au doigt, un « survol » commence au toucher et ne finit
 * jamais, la carte resterait penchée.
 */

const MAX_TILT_DEG = 7;

export function tiltOnPointerMove(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;

  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  // Position du curseur dans la carte, de -0,5 (bord gauche/haut) à 0,5.
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  // Curseur en haut : le haut de la carte recule (rotation X positive).
  element.style.setProperty("--tilt-x", `${(-y * MAX_TILT_DEG).toFixed(2)}deg`);
  element.style.setProperty("--tilt-y", `${(x * MAX_TILT_DEG).toFixed(2)}deg`);
}

export function tiltOnPointerLeave(event: React.PointerEvent<HTMLElement>) {
  const element = event.currentTarget;
  element.style.removeProperty("--tilt-x");
  element.style.removeProperty("--tilt-y");
}

export function spotlightOnPointerMove(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;

  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  element.style.setProperty("--px", `${event.clientX - rect.left}px`);
  element.style.setProperty("--py", `${event.clientY - rect.top}px`);
}
