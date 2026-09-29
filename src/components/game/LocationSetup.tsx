"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCep,
  findHubByCep,
  HUBS,
  hubLabel,
  normalizeCep,
} from "@/lib/game/hubs";
import { useGameStore } from "@/lib/game/store";
import { Crosshair, MapPinned, Navigation } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function LocationSetup() {
  const setLocation = useGameStore((s) => s.setLocation);
  const setPlacingLocation = useGameStore((s) => s.setPlacingLocation);
  const placingLocation = useGameStore((s) => s.placingLocation);
  const [cep, setCep] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  function confirmHub(hubId: string) {
    const hub = HUBS.find((h) => h.id === hubId);
    if (!hub) return;
    setLocation({
      lat: hub.lat,
      lng: hub.lng,
      label: hubLabel(hub),
      cep: hub.cep,
    });
    toast.success("Localização definida", {
      description: hubLabel(hub),
    });
  }

  function onCepSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hub = findHubByCep(cep);
    if (!hub) {
      toast.error("CEP não encontrado na Grande Vitória", {
        description: "Tente um CEP da lista ou escolha um bairro.",
      });
      return;
    }
    setLocation({
      lat: hub.lat,
      lng: hub.lng,
      label: hubLabel(hub),
      cep: formatCep(normalizeCep(cep)),
    });
    toast.success("Localização definida", {
      description: hubLabel(hub),
    });
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocalização indisponível neste navegador.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        setLocation({
          lat: latitude,
          lng: longitude,
          label: "Sua localização atual",
        });
        toast.success("Usando sua localização atual");
      },
      () => {
        setGeoLoading(false);
        toast.error("Não foi possível obter a localização.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  if (placingLocation) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
          <Crosshair className="size-4 shrink-0 text-teal-700" />
          <span>Clique no mapa para definir o ponto de partida.</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setPlacingLocation(false)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-background/85 p-4 backdrop-blur-sm sm:items-center">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Onde você está?</CardTitle>
          <CardDescription>
            Defina sua posição para ver encomendas num raio de 2 km — como um app
            de entregas. Depois escalamos para fretes entre cidades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={onCepSubmit} className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                inputMode="numeric"
                placeholder="29010-100"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                maxLength={9}
              />
              <Button type="submit">Buscar</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Exemplos: 29055-260 (Praia do Canto), 29101-110 (Praia da Costa)
            </p>
          </form>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 gap-2"
              disabled={geoLoading}
              onClick={useGeolocation}
            >
              <Navigation className="size-4" />
              {geoLoading ? "Obtendo…" : "Usar localização atual"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setPlacingLocation(true)}
            >
              <Crosshair className="size-4" />
              Marcar no mapa
            </Button>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MapPinned className="size-4" />
              Ou escolha um bairro
            </div>
            <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
              {HUBS.map((hub) => (
                <Button
                  key={hub.id}
                  type="button"
                  variant="outline"
                  className="h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm"
                  onClick={() => confirmHub(hub.id)}
                >
                  <span>
                    <span className="font-medium">{hub.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {hub.city} · CEP {hub.cep}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
