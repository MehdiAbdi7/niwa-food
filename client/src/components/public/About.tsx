"use client";

import { useEffect, useRef, useState } from "react";

// « 7j/7 » et non plus « 13h+ d'ouverture par jour » : le vendredi, la
// cuisine n'ouvre qu'à 18h, le chiffre était donc faux un jour sur sept.
const FINAL_STATS = { addresses: 2, homemade: 100, days: 7 };
const ZERO_STATS = { addresses: 0, homemade: 0, days: 0 };

const VIDEO_POSTER = "/niwa-video-poster.webp";

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // Valeurs finales dès le rendu serveur : c'est ce que lisent Google et les
  // aperçus de liens, qui n'exécutent pas l'animation. Partir de 0 leur
  // montrait « 0 adresses, 0% fait maison ». Le compteur est remis à zéro
  // côté client, juste avant d'animer.
  const [stats, setStats] = useState(FINAL_STATS);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Mouvement réduit : les valeurs finales sont déjà affichées, rien à faire.
    if (prefersReducedMotion) return;

    // Sous la ligne de flottaison, la section est encore invisible : la remise
    // à zéro ne se voit pas, et l'animation repart de 0 à son arrivée.
    let frameId = requestAnimationFrame(() => setStats(ZERO_STATS));
    let hasStarted = false;

    const animate = () => {
      if (hasStarted) return;
      hasStarted = true;
      const startTime = performance.now();
      const duration = 2200;

      const update = (time: number) => {
        const progress = Math.min((time - startTime) / duration, 1);
        const easedProgress = 1 - (1 - progress) ** 3;

        setStats({
          addresses: Math.round(FINAL_STATS.addresses * easedProgress),
          homemade: Math.round(FINAL_STATS.homemade * easedProgress),
          days: Math.round(FINAL_STATS.days * easedProgress),
        });

        if (progress < 1) frameId = requestAnimationFrame(update);
      };

      frameId = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  // La vidéo ne se télécharge qu'à l'approche de la section (preload="none"
  // + lecture déclenchée ici) : avec autoPlay, elle pesait sur le premier
  // chargement de l'accueil alors qu'elle est sous la ligne de flottaison.
  //
  // Même règle pour l'affiche : un attribut poster se télécharge dès
  // l'ouverture de la page, preload="none" ou pas. Posée ici, au même moment
  // que la lecture, elle ne prend plus de débit à la photo du hero.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.poster = VIDEO_POSTER;
          video.play().catch(() => setIsPlaying(false));
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section
      id="a-propos"
      ref={sectionRef}
      className="relative isolate overflow-hidden contain-paint px-2 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto flex flex-col lg:flex-row max-w-6xl items-center gap-8 rounded-4xl background dark:bg-primary/30 px-4 py-8 shadow-[0_0_25px_5px_rgba(217,169,77,0.45)] shadow-primary/30 backdrop-blur-2xl sm:gap-10 sm:px-8 sm:py-12  md:gap-16 border border-primary">
        <div className="flex flex-col items-center gap-4 text-center sm:text-left md:items-start">
          <span className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-foreground/70">
            L&apos;esprit Niwa
          </span>
          <h2 className="font-heading text-2xl font-bold leading-tight text-accent-green wrap-break-words sm:text-3xl md:text-4xl">
            Le burger artisanal, c&apos;est notre spécialité
          </h2>
          <p className="text-md font-semibold leading-relaxed text-foreground wrap-break-words">
            Chez Niwa Food, tout part d&apos;une idée simple : préparer chaque
            burger, tacos et pizza comme s&apos;il était le premier. Pain toasté
            minute, viande fraîche, sauces maison — rien n&apos;est préparé à
            l&apos;avance et laissé à attendre.
          </p>
          <p className="text-md font-semibold leading-relaxed text-foreground wrap-break-words">
            Depuis nos cuisines à Kouba et Chéraga, on sert celles et ceux qui
            veulent manger vite sans sacrifier le goût — sur place, à emporter,
            ou livré directement chez vous.
          </p>

          <div className="mt-4 grid w-full grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="min-w-0 rounded-2xl border border-primary/60 bg-background/70 p-2 text-center sm:p-3 md:p-4">
              <p className="font-heading text-2xl font-bold text-accent-green sm:text-3xl">
                {stats.addresses}
              </p>
              <p className="text-xs font-semibold leading-tight text-foreground/80 wrap-break-words sm:text-sm">
                Adresses à Alger
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-primary/60 bg-background/70 p-2 text-center sm:p-3 md:p-4">
              <p className="font-heading text-2xl font-bold text-accent-green sm:text-3xl">
                {stats.homemade}%
              </p>
              <p className="text-xs font-semibold leading-tight text-foreground/80 wrap-break-words sm:text-sm">
                Fait maison
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-primary/60 bg-background/70 p-2 text-center sm:p-3 md:p-4">
              <p className="font-heading text-2xl font-bold text-accent-green sm:text-3xl">
                {stats.days}j/7
              </p>
              <p className="text-xs font-semibold leading-tight text-foreground/80 wrap-break-words sm:text-sm">
                Ouvert
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={
            isPlaying ? "Mettre la vidéo en pause" : "Lancer la vidéo"
          }
          className="group relative aspect-square w-full cursor-pointer overflow-hidden contain-paint rounded-[2.5rem] bg-primary/10 shadow-food-lg will-change-transform"
        >
          <video
            ref={videoRef}
            src="/niwa-video.mp4"
            preload="none"
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Bouton play/pause */}
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-4xl bg-black/30 transition-opacity duration-300 ${
              isPlaying
                ? "opacity-0 backdrop-blur-none group-hover:opacity-100 group-hover:backdrop-blur-sm"
                : "opacity-100 backdrop-blur-sm"
            }`}
          >
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-background/90 text-primary ${
                isPlaying
                  ? "icon-[mdi--pause] text-3xl"
                  : "icon-[mdi--play] text-3xl"
              }`}
            />
          </div>
        </button>
      </div>
    </section>
  );
}
