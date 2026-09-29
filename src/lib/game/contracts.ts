import { CONTRACTS_PER_CITY } from "./constants";
import { getCityById } from "./cities";
import { roadDistanceKm, travelDurationSec } from "./geo";
import type { City, Contract, ResourceId } from "./types";

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

function pickQty(rand: () => number): number {
  const options = [5, 8, 10, 12, 15, 20, 25];
  return options[Math.floor(rand() * options.length)]!;
}

function payFor(
  resource: ResourceId,
  qty: number,
  distanceKm: number,
  rand: () => number,
): number {
  const base: Record<ResourceId, number> = {
    cafe: 42,
    minerio: 38,
    aco: 55,
    frutas: 28,
    petroleo: 60,
    gerais: 32,
  };
  const distanceBonus = distanceKm * (2.2 + rand() * 0.8);
  const jitter = 0.85 + rand() * 0.3;
  return Math.round((base[resource] * qty + distanceBonus) * jitter);
}

/** Recursos que a origem oferece e o destino demanda. */
export function matchingResources(from: City, to: City): ResourceId[] {
  const demand = new Set(to.demands);
  return from.offers.filter((r) => demand.has(r));
}

export function citiesWithDemandFor(
  fromCityId: string,
  cities: City[],
): City[] {
  const from = getCityById(fromCityId);
  if (!from) return [];
  return cities.filter((to) => {
    if (to.id === from.id) return false;
    return matchingResources(from, to).length > 0;
  });
}

export function generateContractsForDestination(
  fromCityId: string,
  toCityId: string,
  seedKey = `${fromCityId}->${toCityId}`,
): Contract[] {
  const from = getCityById(fromCityId);
  const to = getCityById(toCityId);
  if (!from || !to) return [];

  const resources = matchingResources(from, to);
  if (resources.length === 0) return [];

  const distanceKm = roadDistanceKm(from.lat, from.lng, to.lat, to.lng);
  const durationSec = travelDurationSec(distanceKm);
  const rand = mulberry32(hashSeed(seedKey));

  const count = Math.min(CONTRACTS_PER_CITY, Math.max(3, resources.length + 1));
  const contracts: Contract[] = [];

  for (let i = 0; i < count; i++) {
    const resource = resources[i % resources.length]!;
    const qty = pickQty(rand);
    contracts.push({
      id: `${seedKey}-${resource}-${i}-${qty}`,
      fromCityId,
      toCityId,
      resource,
      qty,
      pay: payFor(resource, qty, distanceKm, rand),
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationSec,
    });
  }

  return contracts;
}

export function generateContractsFromCity(
  fromCityId: string,
  cities: City[],
): Contract[] {
  return citiesWithDemandFor(fromCityId, cities).flatMap((to) =>
    generateContractsForDestination(fromCityId, to.id),
  );
}

export function straightRouteCoords(
  from: City,
  to: City,
): [number, number][] {
  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];
}
