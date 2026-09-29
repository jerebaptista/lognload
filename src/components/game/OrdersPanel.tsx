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
import { ORDER_RADIUS_KM } from "@/lib/game/constants";
import { formatEtaMinutes, formatKm, formatMoney } from "@/lib/game/geo";
import { useGameStore } from "@/lib/game/store";
import type { DeliveryOrder } from "@/lib/game/types";
import { MapPin, Package, Timer } from "lucide-react";
import { toast } from "sonner";

export function OrdersPanel() {
  const hasLocation = useGameStore((s) => s.player.hasLocation);
  const locationLabel = useGameStore((s) => s.player.locationLabel);
  const vehicle = useGameStore((s) => s.player.vehicle);
  const orders = useGameStore((s) => s.orders);
  const selectedOrderId = useGameStore((s) => s.selectedOrderId);
  const selectOrder = useGameStore((s) => s.selectOrder);
  const acceptOrder = useGameStore((s) => s.acceptOrder);
  const refreshOrders = useGameStore((s) => s.refreshOrders);

  const selected = orders.find((o) => o.id === selectedOrderId) ?? null;
  const active = orders.find((o) => o.id === vehicle.orderId) ?? null;

  function onAccept(orderId: string) {
    const ok = acceptOrder(orderId);
    if (!ok) {
      toast.error("Não foi possível aceitar este pedido.");
      return;
    }
    toast.message("Entrega iniciada", {
      description: "O traço no mapa encolhe até você chegar.",
    });
  }

  if (!hasLocation) {
    return (
      <aside className="hidden w-96 shrink-0 border-l bg-background lg:block" />
    );
  }

  return (
    <aside className="flex max-h-[42vh] w-full shrink-0 flex-col border-t bg-background lg:max-h-none lg:w-96 lg:border-l lg:border-t-0">
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Você está em
          </p>
          <h2 className="text-lg font-semibold leading-snug">{locationLabel}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pedidos num raio de {ORDER_RADIUS_KM} km
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={vehicle.status === "en_route"}
            onClick={refreshOrders}
          >
            Atualizar pedidos
          </Button>
        </div>
        <Separator />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {vehicle.status === "en_route" && active ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Em rota</CardTitle>
              <CardDescription>
                Entregando {active.title} em {active.addressLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ETA {formatEtaMinutes(active.etaMinutes)} · {formatKm(active.distanceKm)} ·{" "}
              {formatMoney(active.pay)}
            </CardContent>
          </Card>
        ) : (
          <OrderList
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelect={selectOrder}
            onAccept={onAccept}
          />
        )}

        {selected && vehicle.status === "idle" ? (
          <div className="mt-3 lg:hidden">
            <Button type="button" className="w-full" onClick={() => onAccept(selected.id)}>
              Aceitar pedido selecionado
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function OrderList({
  orders,
  selectedOrderId,
  onSelect,
  onAccept,
}: {
  orders: DeliveryOrder[];
  selectedOrderId: string | null;
  onSelect: (id: string | null) => void;
  onAccept: (id: string) => void;
}) {
  if (!orders.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sem pedidos agora</CardTitle>
          <CardDescription>
            Toque em &quot;Atualizar pedidos&quot; para buscar novas encomendas no raio.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const selected = order.id === selectedOrderId;
        return (
          <Card
            key={order.id}
            className={selected ? "ring-2 ring-amber-400" : undefined}
            onClick={() => onSelect(order.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{order.title}</CardTitle>
                <Badge variant="secondary">{formatMoney(order.pay)}</Badge>
              </div>
              <CardDescription className="space-y-1 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  {order.addressLabel}
                </span>
                <span className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Package className="size-3.5" />
                    {formatKm(order.distanceKm)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Timer className="size-3.5" />
                    {formatEtaMinutes(order.etaMinutes)}
                  </span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(order.id);
                }}
              >
                Aceitar
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
