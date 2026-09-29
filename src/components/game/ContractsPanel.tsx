"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCityById } from "@/lib/game/cities";
import { RESOURCE_LABELS } from "@/lib/game/constants";
import { formatDuration, formatKm, formatMoney } from "@/lib/game/geo";
import { contractsForSelectedCity, useGameStore } from "@/lib/game/store";
import type { Contract } from "@/lib/game/types";
import { Package, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ContractsPanel() {
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);
  const acceptContract = useGameStore((s) => s.acceptContract);
  const vehicle = useGameStore((s) => s.player.vehicle);
  const contracts = useGameStore((s) => contractsForSelectedCity(s));
  const [isMobile, setIsMobile] = useState(false);

  const selectedCity = selectedCityId ? getCityById(selectedCityId) : undefined;
  const currentCity = getCityById(vehicle.cityId);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function onAccept(contractId: string) {
    const ok = acceptContract(contractId);
    if (!ok) {
      toast.error("Não foi possível aceitar este contrato.");
      return;
    }
    toast.message("Viagem iniciada", {
      description: "Acompanhe o traço da rota no mapa.",
    });
  }

  return (
    <>
      <aside className="hidden w-96 shrink-0 flex-col border-l bg-background lg:flex">
        <div className="flex h-full min-h-0 flex-col">
          <div className="space-y-3 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cidade atual
              </p>
              <h2 className="text-lg font-semibold">{currentCity?.name ?? "—"}</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Oferta: </span>
                {currentCity?.offers.map((r) => RESOURCE_LABELS[r]).join(", ") || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Demanda: </span>
                {currentCity?.demands.map((r) => RESOURCE_LABELS[r]).join(", ") || "—"}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Destino
                </p>
                <p className="font-medium">
                  {selectedCity?.name ?? "Selecione no mapa"}
                </p>
              </div>
              {selectedCity ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => selectCity(null)}
                >
                  Limpar
                </Button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ContractList
              contracts={contracts}
              vehicleStatus={vehicle.status}
              onAccept={onAccept}
            />
          </div>
        </div>
      </aside>

      <Sheet
        open={Boolean(selectedCityId) && isMobile}
        onOpenChange={(next) => {
          if (!next) selectCity(null);
        }}
      >
        <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto lg:hidden">
          <SheetHeader>
            <SheetTitle>{selectedCity?.name ?? "Contratos"}</SheetTitle>
            <SheetDescription>
              De {currentCity?.name ?? "sua cidade"} · escolha um contrato
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <ContractList
              contracts={contracts}
              vehicleStatus={vehicle.status}
              onAccept={onAccept}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ContractList({
  contracts,
  vehicleStatus,
  onAccept,
}: {
  contracts: Contract[];
  vehicleStatus: "idle" | "en_route";
  onAccept: (id: string) => void;
}) {
  if (vehicleStatus === "en_route") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Em viagem</CardTitle>
          <CardDescription>
            Aguarde a entrega terminar para aceitar outro contrato.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!contracts.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sem contratos</CardTitle>
          <CardDescription>
            Clique em uma cidade azul no mapa (demanda compatível com sua oferta).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {contracts.map((contract) => (
        <Card key={contract.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                {RESOURCE_LABELS[contract.resource]}
              </CardTitle>
              <Badge variant="secondary">{formatMoney(contract.pay)}</Badge>
            </div>
            <CardDescription className="flex flex-wrap gap-3 pt-1">
              <span className="inline-flex items-center gap-1">
                <Package className="size-3.5" />
                {contract.qty} t
              </span>
              <span>{formatKm(contract.distanceKm)}</span>
              <span className="inline-flex items-center gap-1">
                <Timer className="size-3.5" />
                {formatDuration(contract.durationSec)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              onClick={() => onAccept(contract.id)}
            >
              Aceitar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
