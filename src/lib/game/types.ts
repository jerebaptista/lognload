export type VehicleStatus = "idle" | "en_route";

export type PackageKind =
  | "encomenda"
  | "comida"
  | "documento"
  | "farmacia"
  | "mercado";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Hub {
  id: string;
  name: string;
  district: string;
  city: string;
  cep: string;
  lat: number;
  lng: number;
}

/** Pedido local estilo app de entrega (raio curto). */
export interface DeliveryOrder {
  id: string;
  title: string;
  addressLabel: string;
  packageKind: PackageKind;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distanceKm: number;
  /** Tempo de percurso no jogo (minutos: 3, 5, 10…). */
  etaMinutes: number;
  /** Duração real da animação em segundos. */
  durationSec: number;
  pay: number;
}

export interface Vehicle {
  id: string;
  status: VehicleStatus;
  lat: number;
  lng: number;
  orderId?: string | null;
  /** 0 = origem, 1 = destino */
  progress01?: number;
  routeCoords?: [number, number][];
  startedAtMs?: number;
}

export interface PlayerState {
  money: number;
  /** false até o jogador definir CEP / hub / GPS / pin. */
  hasLocation: boolean;
  locationLabel: string;
  cep?: string;
  vehicle: Vehicle;
}

export interface GameState {
  player: PlayerState;
  orders: DeliveryOrder[];
  selectedOrderId: string | null;
  version: number;
}
