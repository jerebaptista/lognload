import { ROAD_FACTOR } from "./constants";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distância em linha reta (km) entre dois pontos. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Distância rodoviária aproximada (Haversine × fator). */
export function roadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  return haversineKm(lat1, lng1, lat2, lng2) * ROAD_FACTOR;
}

/** Interpola ao longo de uma polyline [lng, lat][] pelo progresso 0..1. */
export function pointAlongRoute(
  coords: [number, number][],
  progress01: number,
): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1 || progress01 <= 0) return coords[0];
  if (progress01 >= 1) return coords[coords.length - 1];

  const lengths: number[] = [0];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng0, lat0] = coords[i - 1];
    const [lng1, lat1] = coords[i];
    total += haversineKm(lat0, lng0, lat1, lng1);
    lengths.push(total);
  }

  if (total === 0) return coords[0];

  const target = total * progress01;
  let i = 1;
  while (i < lengths.length && lengths[i] < target) i++;

  const prev = lengths[i - 1];
  const next = lengths[i] ?? prev;
  const segLen = next - prev || 1;
  const t = (target - prev) / segLen;
  const a = coords[i - 1];
  const b = coords[i] ?? a;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Retorna a porção restante da rota (do progresso atual até o destino),
 * para desenhar o traço encolhendo.
 */
export function remainingRoute(
  coords: [number, number][],
  progress01: number,
): [number, number][] {
  if (coords.length < 2) return coords;
  const p = Math.min(1, Math.max(0, progress01));
  if (p <= 0) return coords;
  if (p >= 1) return [coords[coords.length - 1]];

  const current = pointAlongRoute(coords, p);

  const lengths: number[] = [0];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng0, lat0] = coords[i - 1];
    const [lng1, lat1] = coords[i];
    total += haversineKm(lat0, lng0, lat1, lng1);
    lengths.push(total);
  }

  const target = total * p;
  let i = 1;
  while (i < lengths.length && lengths[i] < target) i++;

  return [current, ...coords.slice(i)];
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatEtaMinutes(minutes: number): string {
  return `${minutes} min`;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
