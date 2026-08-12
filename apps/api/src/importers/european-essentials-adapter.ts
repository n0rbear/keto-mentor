import { buildSearchText, normalizeSearch } from "../catalog/normalize.js";
import { BlsAdapter } from "./bls-adapter.js";
import { EUROPEAN_ESSENTIALS, EUROPEAN_ESSENTIAL_MUST_FIND, type EssentialSource, type EuropeanEssential } from "./european-essentials-manifest.js";
import type { FoodSourceAdapter, ImportFood, ImportRow } from "./types.js";
import { UsdaFoodDataCentralAdapter } from "./usda-adapter.js";

export type EssentialSearchAudit = {
  total: number;
  passed: number;
  failed: Array<{ key: string; query: string }>;
};

export class EuropeanEssentialsAdapter implements FoodSourceAdapter {
  readonly base: FoodSourceAdapter;
  readonly entries;
  readonly resolvedFoods: ImportFood[] = [];

  constructor(readonly essentialSource: EssentialSource, entries: readonly EuropeanEssential[] = EUROPEAN_ESSENTIALS) {
    this.entries = entries.filter((entry) => entry.source === essentialSource);
    const selectedIds = new Set(this.entries.map((entry) => entry.sourceId));
    this.base = essentialSource === "bls"
      ? new BlsAdapter("4.0 (2025)", undefined, selectedIds)
      : new UsdaFoodDataCentralAdapter("sr_legacy", "2018-04", undefined, selectedIds);
  }

  get sourceName() { return this.base.sourceName; }
  get source() { return this.base.source; }
  get version() { return this.base.version; }
  get diagnostics() { return this.base.diagnostics; }

  async *read(filePath: string): AsyncIterable<ImportRow> {
    this.resolvedFoods.length = 0;
    const bySourceId = new Map(this.entries.map((entry) => [entry.sourceId, entry]));
    const seen = new Set<string>();
    const encountered = new Set<string>();
    for await (const row of this.base.read(filePath)) {
      const sourceId = "error" in row ? row.sourceId : row.food.sourceId;
      if (sourceId) encountered.add(sourceId);
      if ("error" in row) { yield row; continue; }
      const entry = bySourceId.get(row.food.sourceId);
      if (!entry) {
        yield { row: row.row, sourceId: row.food.sourceId, error: "record is not in the approved European essentials manifest" };
        continue;
      }
      const originalName = normalizeSearch(row.food.originalName);
      const missingTokens = entry.expectedNameTokens.filter((token) => !originalName.includes(normalizeSearch(token)));
      if (missingTokens.length) {
        yield { row: row.row, sourceId: row.food.sourceId, error: `source name does not match approved identity tokens: ${missingTokens.join(", ")}` };
        continue;
      }
      const language = entry.source === "bls" ? "de" : "en";
      const food: ImportFood = {
        ...row.food,
        synonyms: {
          ...(row.food.synonyms ?? {}),
          [language]: [...new Set([entry.label, ...entry.synonyms])]
        }
      };
      seen.add(entry.sourceId);
      this.resolvedFoods.push(food);
      yield { ...row, food };
    }
    for (const entry of this.entries) {
      if (!seen.has(entry.sourceId) && !encountered.has(entry.sourceId)) {
        yield { row: 0, sourceId: entry.sourceId, error: `approved essential source record was not resolved: ${entry.label}` };
      }
    }
  }
}

export function auditEssentialSearchCoverage(foods: readonly ImportFood[]): EssentialSearchAudit {
  const byIdentity = new Map(foods.map((food) => [`${food.source}:${food.sourceId}`, food]));
  const failed = EUROPEAN_ESSENTIAL_MUST_FIND.filter(({ key, query }) => {
    const entry = EUROPEAN_ESSENTIALS.find((candidate) => candidate.key === key);
    if (!entry) return true;
    const source = entry.source === "bls" ? "bls" : "usda_fdc";
    const food = byIdentity.get(`${source}:${entry.sourceId}`);
    return !food || !buildSearchText(food).includes(normalizeSearch(query));
  });
  return { total: EUROPEAN_ESSENTIAL_MUST_FIND.length, passed: EUROPEAN_ESSENTIAL_MUST_FIND.length - failed.length, failed };
}
