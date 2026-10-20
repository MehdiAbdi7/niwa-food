// Cloche de comptoir générée à la volée plutôt qu'un fichier .mp3 à héberger.
// Une cloche réelle ne sonne pas sur une seule fréquence : elle superpose des
// partiels « inharmoniques » (2,76 et 5,4 fois la fondamentale, et non 2 et 3
// comme une corde). Ce sont eux qui lui donnent son timbre métallique, et ces
// aigus passent au-dessus du bruit grave d'une cuisine (hotte, friteuse).

const BELL_FUNDAMENTAL_HZ = 1568; // Sol 6

// [rapport à la fondamentale, volume de crête, durée de résonance en s]
const BELL_PARTIALS = [
  [1, 0.28, 1.6],
  [2.76, 0.12, 0.9],
  [5.4, 0.06, 0.5],
  [8.93, 0.03, 0.3],
] as const;

// Double coup, « ding ding », comme la cloche « commande prête » d'un comptoir.
const STRIKE_OFFSETS_S = [0, 0.32];

// Une seule AudioContext pour toute la session, au lieu d'une par bip.
// C'est elle qui porte l'autorisation du navigateur : Chrome et Safari la
// créent « suspendue » tant que la page n'a reçu aucun clic ni toucher, et
// seul un resume() appelé PENDANT un geste de l'utilisateur la débloque.
// En recréer une à chaque commande reperdrait ce déblocage.
let context: AudioContext | null = null;
const listeners = new Set<() => void>();

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    try {
      context = new AudioContext();
    } catch {
      return null;
    }
    context.onstatechange = () => listeners.forEach((listener) => listener());
  }
  return context;
}

/** À appeler depuis un gestionnaire de clic ou de touche : débloque le son. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state !== "running") void ctx.resume().catch(() => {});
}

/** Abonnement pour useSyncExternalStore : prévient à chaque blocage ou déblocage. */
export function subscribeAudioState(listener: () => void): () => void {
  getContext();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Vrai tant que le navigateur refuse de jouer du son. */
export function isAudioBlocked(): boolean {
  const ctx = getContext();
  // Pas d'AudioContext du tout (navigateur très ancien) : rien à débloquer,
  // inutile d'afficher un message que l'utilisateur ne pourrait pas résoudre.
  return ctx !== null && ctx.state !== "running";
}

function strike(
  ctx: AudioContext,
  freq: number,
  start: number,
  peak: number,
  decay: number,
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;

  // Montée quasi instantanée (le choc du marteau), puis décroissance
  // exponentielle, comme une vraie résonance. exponentialRamp refuse 0,
  // d'où le 0.0001, inaudible.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.002 + decay);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + decay + 0.05);
}

export function playNewOrderBell(): void {
  const ctx = getContext();
  // Son bloqué : on n'insiste pas, le bandeau de NewOrderAlert demande déjà
  // de toucher l'écran, et la cloche repartira au déblocage.
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime + 0.03;
  STRIKE_OFFSETS_S.forEach((offset) => {
    BELL_PARTIALS.forEach(([ratio, peak, decay]) => {
      strike(ctx, BELL_FUNDAMENTAL_HZ * ratio, now + offset, peak, decay);
    });
  });
}
