"use client";

import { GameHeader } from "@/components/game/GameHeader";
import { LocationSetup } from "@/components/game/LocationSetup";
import { OrdersPanel } from "@/components/game/OrdersPanel";
import { formatMoney } from "@/lib/game/geo";
import { useGameStore } from "@/lib/game/store";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { toast } from "sonner";

const GameMap = dynamic(
  () => import("@/components/game/GameMap").then((m) => m.GameMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Carregando mapa…
      </div>
    ),
  },
);

export function GameShell() {
  const hydrated = useGameStore((s) => s.hydrated);
  const hasLocation = useGameStore((s) => s.player.hasLocation);
  const tickTravel = useGameStore((s) => s.tickTravel);
  const setHydrated = useGameStore((s) => s.setHydrated);

  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
    }
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const id = window.setInterval(() => {
      const { completed } = tickTravel(Date.now());
      if (completed) {
        toast.success("Entrega concluída!", {
          description: `${completed.title} · ${completed.addressLabel} · +${formatMoney(completed.pay)}`,
        });
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [hydrated, tickTravel]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Carregando Log &apos;n Load…
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <GameHeader />
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-0 flex-1">
          <GameMap />
          {!hasLocation ? <LocationSetup /> : null}
        </div>
        {hasLocation ? <OrdersPanel /> : null}
      </div>
    </div>
  );
}
