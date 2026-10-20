"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { playTestBell } from "@/lib/orderAlertSound";

// Vérifie le son de CET appareil sans attendre une vraie commande : volume
// trop bas, iPhone qui refuse le son, haut-parleur coupé. À faire en début
// de service sur chaque poste (caisse, tablette de cuisine).
export function SoundCard() {
  const [isRefused, setIsRefused] = useState(false);

  async function handleTest() {
    // Appelé directement dans le clic : c'est ce geste qui autorise le son.
    const isPlaying = await playTestBell();
    setIsRefused(!isPlaying);
  }

  return (
    <section className="surface-card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-bold text-foreground">
          Alertes sonores
        </h2>
        <p className="text-sm text-foreground/75">
          La cloche sonne à chaque nouvelle commande, sur toutes les pages, puis
          toutes les 30 secondes tant que personne ne l&apos;a vue.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          icon="icon-[mdi--bell-ring-outline]"
          onClick={handleTest}
        >
          Tester le son
        </Button>
        {isRefused && (
          <p role="status" className="text-sm text-accent-bordeaux">
            Le navigateur refuse le son sur cet appareil.
          </p>
        )}
      </div>
    </section>
  );
}
