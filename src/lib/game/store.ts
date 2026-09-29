"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CITIES, getCityById } from "./cities";
import {
  GAME_VERSION,
  HOME_CITY_ID,
  SAVE_KEY,
  STARTING_MONEY,
  VEHICLE_ID,
} from "./constants";
import {
  generateContractsFromCity,
  straightRouteCoords,
} from "./contracts";
import type { Contract, GameState, PlayerState } from "./types";

function createInitialPlayer(): PlayerState {
  return {
    money: STARTING_MONEY,
    homeCityId: HOME_CITY_ID,
    vehicle: {
      id: VEHICLE_ID,
      cityId: HOME_CITY_ID,
      status: "idle",
      contractId: null,
      progress01: 0,
      routeCoords: undefined,
      startedAtMs: undefined,
    },
  };
}

function createInitialState(): Omit<GameStore, keyof GameActions> {
  const player = createInitialPlayer();
  return {
    player,
    contracts: generateContractsFromCity(player.vehicle.cityId, CITIES),
    selectedCityId: null,
    version: GAME_VERSION,
    hydrated: false,
  };
}

interface GameActions {
  setHydrated: (value: boolean) => void;
  selectCity: (cityId: string | null) => void;
  acceptContract: (contractId: string) => boolean;
  tickTravel: (nowMs: number) => { completed: Contract | null };
  refreshContracts: () => void;
  resetGame: () => void;
}

export type GameStore = GameState & {
  hydrated: boolean;
} & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      setHydrated: (value) => set({ hydrated: value }),

      selectCity: (cityId) => set({ selectedCityId: cityId }),

      refreshContracts: () => {
        const { player } = get();
        if (player.vehicle.status === "en_route") return;
        set({
          contracts: generateContractsFromCity(player.vehicle.cityId, CITIES),
        });
      },

      acceptContract: (contractId) => {
        const { player, contracts } = get();
        if (player.vehicle.status === "en_route") return false;

        const contract = contracts.find((c) => c.id === contractId);
        if (!contract) return false;
        if (contract.fromCityId !== player.vehicle.cityId) return false;

        const from = getCityById(contract.fromCityId);
        const to = getCityById(contract.toCityId);
        if (!from || !to) return false;

        set({
          selectedCityId: contract.toCityId,
          player: {
            ...player,
            vehicle: {
              ...player.vehicle,
              status: "en_route",
              contractId: contract.id,
              progress01: 0,
              routeCoords: straightRouteCoords(from, to),
              startedAtMs: Date.now(),
            },
          },
        });
        return true;
      },

      tickTravel: (nowMs) => {
        const { player, contracts } = get();
        const { vehicle } = player;

        if (vehicle.status !== "en_route" || !vehicle.contractId || !vehicle.startedAtMs) {
          return { completed: null };
        }

        const contract = contracts.find((c) => c.id === vehicle.contractId);
        if (!contract) {
          set({
            player: {
              ...player,
              vehicle: {
                ...vehicle,
                status: "idle",
                contractId: null,
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
          (nowMs - vehicle.startedAtMs) / (contract.durationSec * 1000),
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

        const nextPlayer: PlayerState = {
          ...player,
          money: player.money + contract.pay,
          vehicle: {
            ...vehicle,
            cityId: contract.toCityId,
            status: "idle",
            contractId: null,
            progress01: 0,
            routeCoords: undefined,
            startedAtMs: undefined,
          },
        };

        set({
          player: nextPlayer,
          contracts: generateContractsFromCity(contract.toCityId, CITIES),
          selectedCityId: contract.toCityId,
        });

        return { completed: contract };
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
        contracts: state.contracts,
        selectedCityId: state.selectedCityId,
        version: state.version,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function contractsForSelectedCity(state: GameStore): Contract[] {
  const { selectedCityId, contracts, player } = state;
  if (!selectedCityId) return [];
  return contracts.filter(
    (c) =>
      c.toCityId === selectedCityId &&
      c.fromCityId === player.vehicle.cityId,
  );
}
