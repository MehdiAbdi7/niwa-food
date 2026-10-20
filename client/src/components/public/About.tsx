"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "@/features/motion/useReducedMotion";
import { useScrollProgress } from "@/features/motion/useScrollProgress";
import { useI18n } from "@/i18n/I18nProvider";
import { fill } from "@/i18n/text";

// « 7j/7 » et non plus « 13h+ d'ouverture par jour » : le vendredi, la
// cuisine n'ouvre qu'à 18h, le chiffre était donc faux un jour sur sept.
const FINAL_STATS = { addresses: 2, homemade: 100, days: 7 };
const COUNT_DURATION_MS = 1400;

// Avancement du défilement à partir duquel les pastilles se collent sur la
// vidéo : quand elle est presque posée.
const STICKERS_AT = 0.85;

const VIDEO_POSTER = "/niwa-video-poster.webp";

/**
 * L'esprit Niwa : le texte à gauche, la vidéo à droite (l'un sous l'autre
 * sur téléphone).
 *
 * La vidéo arrive un peu plus petite et de travers, et se pose à mesure
 * qu'elle entre dans l'écran. Le défilement est écrit dans la variable --p
 * de la vidéo, le CSS (.scene-video) en déduit l'échelle et l'inclinaison.
 * Une fois la vidéo presque posée, trois pastilles se collent dessus et
 * leurs compteurs défilent.
 */
export function About() {
  const prefersReducedMotion = useReducedMotion();
  const { dict } = useI18n();
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Valeurs finales dès le rendu serveur : c'est ce que lisent Google et les
  // aperçus de liens, qui n'exécutent pas l'animation.
  const [stats, setStats] = useState(FINAL_STATS);
  const hasCounted = useRef(false);
  const countFrame = useRef(0);

  const startCounting = useCallback(() => {
    if (hasCounted.current) return;
    hasCounted.current = true;
    const startTime = performance.now();

    const update = (time: number) => {
      const progress = Math.min((time - startTime) / COUNT_DURATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      setStats({
        addresses: Math.round(FINAL_STATS.addresses * eased),
        homemade: Math.round(FINAL_STATS.homemade * eased),
        days: Math.round(FINAL_STATS.days * eased),
      });
      if (progress < 1) countFrame.current = requestAnimationFrame(update);
    };

    countFrame.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => () => cancelAnimationFrame(countFrame.current), []);

  const render = useCallback(
    (progress: number) => {
      const scene = sceneRef.current;
      if (!scene) return;
      scene.style.setProperty("--p", progress.toFixed(4));
      const showStickers = progress >= STICKERS_AT;
      scene.dataset.stickers = showStickers ? "shown" : "hidden";
      if (showStickers) startCounting();
    },
    [startCounting],
  );

  // Rien n'est caché ni rétréci avant ce premier appel : sans JavaScript, ou
  // avec les animations réduites, la scène reste dans son état final.
  // p = 0 quand le haut de la vidéo apparaît en bas de l'écran, p = 1 quand
  // son bas est à 95 % de la hauteur : elle est posée dès qu'on la voit
  // entière.
  useScrollProgress(sceneRef, render, {
    start: 1,
    end: 0.95,
    enabled: !prefersReducedMotion,
  });

  // La vidéo ne se télécharge qu'à l'approche de la scène (preload="none"
  // + lecture déclenchée ici) : avec autoPlay, elle pesait sur le premier
  // chargement de l'accueil alors qu'elle est loin sous la ligne de
  // flottaison.
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
    <section id="a-propos" className="px-4 sm:px-8">
      {/* Texte à gauche, vidéo à droite dès lg ; l'un sous l'autre avant. */}
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-[2.6rem] font-bold leading-[0.95] tracking-[-0.01em] text-foreground sm:text-6xl lg:text-[3.5rem]">
            {dict.homeAbout.title}
          </h2>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-foreground/80 sm:text-lg">
            {dict.homeAbout.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* La vidéo et ses pastilles. max-w-[34rem] : la vidéo source fait
            540 px de côté, au-delà elle deviendrait floue. */}
        <div
          ref={sceneRef}
          className="scene scene-video relative mx-auto aspect-square w-full max-w-[34rem]"
        >
          <button
            type="button"
            onClick={togglePlay}
            aria-label={
              isPlaying ? dict.homeAbout.pauseVideo : dict.homeAbout.playVideo
            }
            className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-[2.25rem] bg-primary/15 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent-green"
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

            <span
              className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${
                isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-16 w-16 items-center justify-center rounded-full bg-background/90 text-3xl text-foreground ${
                  isPlaying ? "icon-[mdi--pause]" : "icon-[mdi--play]"
                }`}
              />
            </span>
          </button>

          {/* Les pastilles, collées de travers. Dans les coins de la vidéo
              sur téléphone, à cheval sur ses bords dès md : hors du cadre,
              elles dépasseraient de l'écran d'un téléphone. */}
          <p
            className="scene-sticker absolute left-3 top-3 flex flex-col rounded-2xl bg-primary px-4 py-2.5 text-on-primary shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] md:-left-10 md:top-10"
            style={{ "--r": "-8deg" } as CSSProperties}
          >
            <span className="font-heading text-4xl font-bold leading-none tabular-nums">
              {stats.addresses}
            </span>
            <span className="text-sm font-bold">
              {dict.homeAbout.addresses}
            </span>
          </p>

          <p
            className="scene-sticker absolute right-3 top-1/2 flex flex-col rounded-2xl bg-sticker px-4 py-2.5 text-sticker-ink shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] md:-right-6"
            style={{ "--r": "6deg" } as CSSProperties}
          >
            <span className="font-heading text-4xl font-bold leading-none tabular-nums">
              {stats.homemade}&nbsp;%
            </span>
            <span className="text-sm font-bold">{dict.homeAbout.homemade}</span>
          </p>

          <p
            className="scene-sticker absolute bottom-3 left-6 flex flex-col rounded-2xl bg-surface px-4 py-2.5 text-foreground shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] md:-bottom-6 md:left-12"
            style={{ "--r": "-4deg" } as CSSProperties}
          >
            <span className="font-heading text-4xl font-bold leading-none tabular-nums">
              {fill(dict.homeAbout.daysPerWeek, { days: stats.days })}
            </span>
            <span className="text-sm font-bold">{dict.homeAbout.open}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
