import type { ResourceId } from "./types";

export const GAME_VERSION = 1;
export const SAVE_KEY = "lognload-save-v1";

export const HOME_CITY_ID = "vitoria";
export const STARTING_MONEY = 5_000;
export const VEHICLE_ID = "car-1";

/** Velocidade simulada do carro (km/h). */
export const CAR_SPEED_KMH = 70;

/** Multiplica Haversine para aproximar estrada (não linha reta). */
export const ROAD_FACTOR = 1.3;

/**
 * Compressão de tempo: 1h de viagem no jogo ≈ 60s reais.
 * durationSec = (km / velocidade) * 3600 / TIME_COMPRESSION
 */
export const TIME_COMPRESSION = 60;

/** Quantos contratos gerar por cidade destino. */
export const CONTRACTS_PER_CITY = 4;

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  cafe: "Café",
  minerio: "Minério",
  aco: "Aço",
  frutas: "Frutas",
  petroleo: "Petróleo",
  gerais: "Mercadorias",
};

/** Centro aproximado do Espírito Santo [lng, lat]. */
export const ES_MAP_CENTER: [number, number] = [-40.35, -19.85];
export const ES_MAP_ZOOM = 7.6;

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
