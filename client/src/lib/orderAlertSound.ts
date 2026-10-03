// Bip généré à la volée plutôt qu'un fichier .mp3 à héberger — deux notes
// courtes, suffisant pour attirer l'attention sans être agressif en cuisine.
export function playNewOrderBeep(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [880, 1108].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = freq;
      oscillator.type = "sine";

      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + 0.13);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    });

    setTimeout(() => ctx.close(), 500);
  } catch {
    // AudioContext peut être bloqué avant toute interaction utilisateur —
    // on échoue silencieusement, ce n'est qu'un confort.
  }
}
