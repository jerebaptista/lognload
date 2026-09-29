"use client";

import { ContractsPanel } from "@/components/game/ContractsPanel";
import { GameHeader } from "@/components/game/GameHeader";
import { getCityById } from "@/lib/game/cities";
import { RESOURCE_LABELS } from "@/lib/game/constants";
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
  const tickTravel = useGameStore((s) => s.tickTravel);
  const setHydrated = useGameStore((s) => s.setHydrated);

  useEffect(() => {
    // Fallback caso onRehydrateStorage já tenha rodado antes do subscribe.
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
    }
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const id = window.setInterval(() => {
      const { completed } = tickTravel(Date.now());
      if (completed) {
        const to = getCityById(completed.toCityId);
        toast.success("Entrega concluída!", {
          description: `${RESOURCE_LABELS[completed.resource]} em ${to?.name ?? "destino"} · +${formatMoney(completed.pay)}`,
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
      <div className="flex min-h-0 flex-1">
        <GameMap />
        <ContractsPanel />
      </div>
    </div>
  );
}
