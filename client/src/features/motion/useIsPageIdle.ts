"use client";

import { useEffect, useState } from "react";

/**
 * Devient vrai une fois la page chargée ET le navigateur au repos.
 *
 * Pour tout ce qui peut attendre sans que personne ne le remarque : les
 * photos 2 à 5 du hero, les copies qui font boucler les avis. Rendus tout de
 * suite, ils prenaient du réseau à la photo principale (l'élément LCP) et du
 * temps au premier calcul de la page.
 *
 * Après l'événement load, puis requestIdleCallback : la page a fini son
 * travail utile. requestIdleCallback n'existe pas sur Safari, d'où le repli
 * sur un simple délai.
 */
export function useIsPageIdle() {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const markIdle = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(() => setIsIdle(true), {
          timeout: 2000,
        });
      } else {
        timeoutId = setTimeout(() => setIsIdle(true), 500);
      }
    };

    if (document.readyState === "complete") markIdle();
    else window.addEventListener("load", markIdle, { once: true });

    return () => {
      window.removeEventListener("load", markIdle);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return isIdle;
}
