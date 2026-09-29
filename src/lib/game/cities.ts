/** Dados de cidades do ES — reservados para fretes intermunicipais (próxima etapa). */

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  offers: string[];
  demands: string[];
}

import citiesData from "@/data/cities.json";

export const CITIES = citiesData as City[];

export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
