import type { Hub } from "@/lib/game/types";
import hubsData from "@/data/hubs.json";

export const HUBS = hubsData as Hub[];

export function getHubById(id: string): Hub | undefined {
  return HUBS.find((h) => h.id === id);
}

/** Normaliza CEP para só dígitos (8). */
export function normalizeCep(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(digits: string): string {
  const d = normalizeCep(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/**
 * Busca hub pelo CEP (match exato ou pelos 5 primeiros dígitos = região).
 */
export function findHubByCep(raw: string): Hub | undefined {
  const digits = normalizeCep(raw);
  if (digits.length < 5) return undefined;

  const exact = HUBS.find((h) => normalizeCep(h.cep) === digits);
  if (exact) return exact;

  const prefix = digits.slice(0, 5);
  return HUBS.find((h) => normalizeCep(h.cep).startsWith(prefix));
}

export function hubLabel(hub: Hub): string {
  return `${hub.name}, ${hub.city}`;
}
