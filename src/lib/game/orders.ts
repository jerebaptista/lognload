import {
  CITY_SPEED_KMH,
  MIN_ORDER_DISTANCE_KM,
  ORDER_RADIUS_KM,
  ORDERS_IN_RADIUS,
  PACKAGE_LABELS,
  REAL_SECONDS_PER_GAME_MINUTE,
  ROAD_FACTOR,
} from "./constants";
import { haversineKm } from "./geo";
import type { DeliveryOrder, PackageKind } from "./types";

const PACKAGE_KINDS: PackageKind[] = [
  "encomenda",
  "comida",
  "documento",
  "farmacia",
  "mercado",
];

const STREET_NAMES = [
  "Rua das Palmeiras",
  "Av. Vitória",
  "Rua Sete de Setembro",
  "Av. Nossa Senhora da Penha",
  "Rua Aleixo Netto",
  "Av. Saturnino de Brito",
  "Rua Constante Sodré",
  "Av. Hugo Musso",
  "Rua Chapot Presvot",
  "Av. Dante Michelini",
  "Rua Joaquim Lírio",
  "Av. Leitão da Silva",
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Offset em km → delta lat/lng aproximado. */
function offsetLatLng(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingRad: number,
): { lat: number; lng: number } {
  const dLat = (distanceKm * Math.cos(bearingRad)) / 111.32;
  const dLng =
    (distanceKm * Math.sin(bearingRad)) /
    (111.32 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/** Buckets de ETA no jogo (minutos). */
export function etaMinutesForDistance(roadKm: number): number {
  if (roadKm < 0.55) return 3;
  if (roadKm < 0.9) return 5;
  if (roadKm < 1.35) return 10;
  if (roadKm < 1.75) return 15;
  return 20;
}

export function durationSecFromEta(etaMinutes: number): number {
  return Math.max(4, Math.round(etaMinutes * REAL_SECONDS_PER_GAME_MINUTE));
}

function payFor(
  kind: PackageKind,
  roadKm: number,
  etaMinutes: number,
  rand: () => number,
): number {
  const base: Record<PackageKind, number> = {
    encomenda: 12,
    comida: 14,
    documento: 10,
    farmacia: 16,
    mercado: 18,
  };
  const distancePay = roadKm * (8 + rand() * 4);
  const timePay = etaMinutes * 0.35;
  const jitter = 0.9 + rand() * 0.25;
  return Math.round((base[kind] + distancePay + timePay) * jitter);
}

export function generateOrdersAround(
  lat: number,
  lng: number,
  seedKey = `${lat.toFixed(4)},${lng.toFixed(4)}-${Date.now()}`,
): DeliveryOrder[] {
  const rand = mulberry32(hashSeed(seedKey));
  const orders: DeliveryOrder[] = [];

  for (let i = 0; i < ORDERS_IN_RADIUS; i++) {
    const kind = PACKAGE_KINDS[Math.floor(rand() * PACKAGE_KINDS.length)]!;
    const distanceStraight =
      MIN_ORDER_DISTANCE_KM +
      rand() * (ORDER_RADIUS_KM - MIN_ORDER_DISTANCE_KM);
    const bearing = rand() * Math.PI * 2;
    const dest = offsetLatLng(lat, lng, distanceStraight, bearing);
    const roadKm =
      Math.round(haversineKm(lat, lng, dest.lat, dest.lng) * ROAD_FACTOR * 100) /
      100;
    const etaMinutes = etaMinutesForDistance(roadKm);
    const street = STREET_NAMES[Math.floor(rand() * STREET_NAMES.length)]!;
    const number = 20 + Math.floor(rand() * 980);

    orders.push({
      id: `ord-${seedKey}-${i}-${kind}`,
      title: PACKAGE_LABELS[kind],
      addressLabel: `${street}, ${number}`,
      packageKind: kind,
      fromLat: lat,
      fromLng: lng,
      toLat: dest.lat,
      toLng: dest.lng,
      distanceKm: roadKm,
      etaMinutes,
      durationSec: durationSecFromEta(etaMinutes),
      pay: payFor(kind, roadKm, etaMinutes, rand),
    });
  }

  return orders.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function straightRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): [number, number][] {
  return [
    [fromLng, fromLat],
    [toLng, toLat],
  ];
}

/** ETA teórico pela velocidade urbana (não usado no timer principal). */
export function urbanEtaMinutes(distanceKm: number): number {
  return Math.max(3, Math.round((distanceKm / CITY_SPEED_KMH) * 60));
}
