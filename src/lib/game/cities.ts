import type { City } from "@/lib/game/types";
import citiesData from "@/data/cities.json";

export const CITIES = citiesData as City[];

export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function getCityMap(): Record<string, City> {
  return Object.fromEntries(CITIES.map((c) => [c.id, c]));
}
