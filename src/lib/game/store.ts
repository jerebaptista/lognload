"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GAME_VERSION,
  SAVE_KEY,
  STARTING_MONEY,
  VEHICLE_ID,
} from "./constants";
import { pointAlongRoute } from "./geo";
import { generateOrdersAround, straightRoute } from "./orders";
import type { DeliveryOrder, GameState, PlayerState } from "./types";

function createBlankPlayer(): PlayerState {
  return {
    money: STARTING_MONEY,
    hasLocation: false,
    locationLabel: "",
    cep: undefined,
    vehicle: {
      id: VEHICLE_ID,
      status: "idle",
      lat: -20.3155,
      lng: -40.3128,
      orderId: null,
      progress01: 0,
      routeCoords: undefined,
      startedAtMs: undefined,
    },
  };
}

function createInitialState(): Omit<GameStore, keyof GameActions> {
  return {
    player: createBlankPlayer(),
    orders: [],
    selectedOrderId: null,
    version: GAME_VERSION,
    hydrated: false,
    placingLocation: false,
  };
}

interface GameActions {
  setHydrated: (value: boolean) => void;
  setPlacingLocation: (value: boolean) => void;
  setLocation: (opts: {
    lat: number;
    lng: number;
    label: string;
    cep?: string;
  }) => void;
  selectOrder: (orderId: string | null) => void;
  acceptOrder: (orderId: string) => boolean;
  tickTravel: (nowMs: number) => { completed: DeliveryOrder | null };
  refreshOrders: () => void;
  resetGame: () => void;
}

export type GameStore = GameState & {
  hydrated: boolean;
  /** Modo "clique no mapa para definir posição". */
  placingLocation: boolean;
} & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      setHydrated: (value) => set({ hydrated: value }),

      setPlacingLocation: (value) => set({ placingLocation: value }),

      setLocation: ({ lat, lng, label, cep }) => {
        const { player } = get();
        set({
          placingLocation: false,
          selectedOrderId: null,
          player: {
            ...player,
            hasLocation: true,
            locationLabel: label,
            cep,
            vehicle: {
              ...player.vehicle,
              lat,
              lng,
              status: "idle",
              orderId: null,
              progress01: 0,
              routeCoords: undefined,
              startedAtMs: undefined,
            },
          },
          orders: generateOrdersAround(lat, lng),
        });
      },

      selectOrder: (orderId) => set({ selectedOrderId: orderId }),

      refreshOrders: () => {
        const { player } = get();
        if (!player.hasLocation || player.vehicle.status === "en_route") return;
        set({
          orders: generateOrdersAround(player.vehicle.lat, player.vehicle.lng),
          selectedOrderId: null,
        });
      },

      acceptOrder: (orderId) => {
        const { player, orders } = get();
        if (!player.hasLocation || player.vehicle.status === "en_route") {
          return false;
        }

        const order = orders.find((o) => o.id === orderId);
        if (!order) return false;

        set({
          selectedOrderId: orderId,
          player: {
            ...player,
            vehicle: {
              ...player.vehicle,
              status: "en_route",
              orderId: order.id,
              progress01: 0,
              routeCoords: straightRoute(
                player.vehicle.lat,
                player.vehicle.lng,
                order.toLat,
                order.toLng,
              ),
              startedAtMs: Date.now(),
            },
          },
        });
        return true;
      },

      tickTravel: (nowMs) => {
        const { player, orders } = get();
        const { vehicle } = player;

        if (
          vehicle.status !== "en_route" ||
          !vehicle.orderId ||
          !vehicle.startedAtMs
        ) {
          return { completed: null };
        }

        const order = orders.find((o) => o.id === vehicle.orderId);
        if (!order) {
          set({
            player: {
              ...player,
              vehicle: {
                ...vehicle,
                status: "idle",
                orderId: null,
                progress01: 0,
                routeCoords: undefined,
                startedAtMs: undefined,
              },
            },
          });
          return { completed: null };
        }

        const progress01 = Math.min(
          1,
          (nowMs - vehicle.startedAtMs) / (order.durationSec * 1000),
        );

        if (progress01 < 1) {
          if (Math.abs((vehicle.progress01 ?? 0) - progress01) > 0.002) {
            set({
              player: {
                ...player,
                vehicle: { ...vehicle, progress01 },
              },
            });
          }
          return { completed: null };
        }

        const route = vehicle.routeCoords ?? [
          [vehicle.lng, vehicle.lat],
          [order.toLng, order.toLat],
        ];
        const [lng, lat] = pointAlongRoute(route, 1);

        const nextPlayer: PlayerState = {
          ...player,
          money: player.money + order.pay,
          locationLabel: order.addressLabel,
          vehicle: {
            ...vehicle,
            lat,
            lng,
            status: "idle",
            orderId: null,
            progress01: 0,
            routeCoords: undefined,
            startedAtMs: undefined,
          },
        };

        set({
          player: nextPlayer,
          orders: generateOrdersAround(lat, lng),
          selectedOrderId: null,
        });

        return { completed: order };
      },

      resetGame: () => {
        const next = createInitialState();
        set({ ...next, hydrated: true });
      },
    }),
    {
      name: SAVE_KEY,
      partialize: (state) => ({
        player: state.player,
        orders: state.orders,
        selectedOrderId: state.selectedOrderId,
        version: state.version,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
