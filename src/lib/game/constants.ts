import type { PackageKind } from "./types";

/** Bump para invalidar save antigo (modo cidades → entregas locais). */
export const GAME_VERSION = 2;
export const SAVE_KEY = "lognload-save-v2";

export const STARTING_MONEY = 120;
export const VEHICLE_ID = "bike-1";

/** Raio de pedidos disponíveis (km). */
export const ORDER_RADIUS_KM = 2;

/** Quantos pedidos gerar em torno da posição atual. */
export const ORDERS_IN_RADIUS = 5;

/** Distância mínima do pedido (km) para não nascer em cima do jogador. */
export const MIN_ORDER_DISTANCE_KM = 0.35;

/**
 * 1 minuto de jogo ≈ N segundos reais.
 * Ex.: ETA 10 min → ~20s de animação.
 */
export const REAL_SECONDS_PER_GAME_MINUTE = 2;

/** Velocidade urbana simulada (só para flavor / fallback). */
export const CITY_SPEED_KMH = 28;

export const ROAD_FACTOR = 1.25;

export const PACKAGE_LABELS: Record<PackageKind, string> = {
  encomenda: "Encomenda",
  comida: "Comida",
  documento: "Documento",
  farmacia: "Farmácia",
  mercado: "Mercado",
};

/** Centro da Grande Vitória [lng, lat] — zoom de bairro. */
export const LOCAL_MAP_CENTER: [number, number] = [-40.32, -20.3];
export const LOCAL_MAP_ZOOM = 12.5;
export const PLAYING_MAP_ZOOM = 13.4;

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
