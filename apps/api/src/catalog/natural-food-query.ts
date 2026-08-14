import { normalizeSearch } from "./normalize.js";

const UNITS = new Map([
  ["g", "g"], ["gramm", "g"], ["gram", "g"], ["kg", "kg"], ["kilogramm", "kg"],
  ["db", "piece"], ["darab", "piece"], ["piece", "piece"], ["stuk", "piece"], ["stuck", "piece"],
  ["szelet", "slice"], ["slice", "slice"], ["adag", "portion"], ["portion", "portion"],
  ["ek", "tbsp"], ["evokanal", "tbsp"], ["tbsp", "tbsp"], ["tk", "tsp"], ["teaskanal", "tsp"], ["tsp", "tsp"]
]);

export function parseNaturalFoodQuery(raw: string) {
  const normalized = normalizeSearch(raw);
  const match = normalized.match(/^(\d+(?:[.,]\d+)?)\s*([a-z]+)?\s+(.+)$/);
  if (!match) return { foodQuery: normalized };
  const unit = match[2] ? UNITS.get(match[2]) : undefined;
  if (match[2] && !unit) return { foodQuery: normalized };
  return { quantity: Number(match[1].replace(",", ".")), unit: unit ?? "piece", foodQuery: match[3] };
}
