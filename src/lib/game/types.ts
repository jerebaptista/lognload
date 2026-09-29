export type ResourceId =
  | "cafe"
  | "minerio"
  | "aco"
  | "frutas"
  | "petroleo"
  | "gerais";

export type VehicleStatus = "idle" | "en_route";

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  offers: ResourceId[];
  demands: ResourceId[];
}

export interface Contract {
  id: string;
  fromCityId: string;
  toCityId: string;
  resource: ResourceId;
  qty: number;
  pay: number;
  distanceKm: number;
  durationSec: number;
}

export interface Vehicle {
  id: string;
  cityId: string;
  status: VehicleStatus;
  contractId?: string | null;
  /** 0 = origem, 1 = destino */
  progress01?: number;
  routeCoords?: [number, number][];
  startedAtMs?: number;
}

export interface PlayerState {
  money: number;
  homeCityId: string;
  vehicle: Vehicle;
}

export interface GameState {
  player: PlayerState;
  contracts: Contract[];
  selectedCityId: string | null;
  version: number;
}
