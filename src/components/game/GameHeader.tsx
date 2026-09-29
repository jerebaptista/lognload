"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/game/geo";
import { useGameStore } from "@/lib/game/store";
import { MapPin, Truck, Wallet } from "lucide-react";

export function GameHeader() {
  const money = useGameStore((s) => s.player.money);
  const hasLocation = useGameStore((s) => s.player.hasLocation);
  const locationLabel = useGameStore((s) => s.player.locationLabel);
  const status = useGameStore((s) => s.player.vehicle.status);
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
          Log &apos;n Load
        </h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Entregas locais · Grande Vitória
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-sm">
          <Wallet className="size-3.5" />
          {formatMoney(money)}
        </Badge>
        {hasLocation ? (
          <Badge variant="outline" className="max-w-[12rem] gap-1.5 truncate px-2.5 py-1 text-sm">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </Badge>
        ) : null}
        <Badge
          variant={status === "en_route" ? "default" : "outline"}
          className="gap-1.5 px-2.5 py-1 text-sm"
        >
          <Truck className="size-3.5" />
          {status === "en_route" ? "Em rota" : "Parado"}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={resetGame}
        >
          Reset
        </Button>
      </div>
    </header>
  );
}
