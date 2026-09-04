import { normalizeSearch } from "../catalog/normalize.js";
import { BlsAdapter } from "./bls-adapter.js";
import {
  EVERYDAY_COVERAGE_V2,
  EVERYDAY_SEARCH_CORPUS,
  type EverydayCoverageEntry,
  type EverydayCoverageSource
} from "./everyday-coverage-manifest.js";
import type { FoodSourceAdapter, ImportFood, ImportRow } from "./types.js";
import { UsdaFoodDataCentralAdapter } from "./usda-adapter.js";

export type EverydayMustFindAudit = {
  total: number;
  passed: number;
  failed: Array<{ concept: string; query: string; source: string; sourceId: string }>;
};

export class EverydayCoverageAdapter implements FoodSourceAdapter {
  readonly base: FoodSourceAdapter;
  readonly entries: readonly EverydayCoverageEntry[];
  readonly resolvedFoods: ImportFood[] = [];

  constructor(readonly coverageSource: EverydayCoverageSource, entries: readonly EverydayCoverageEntry[] = EVERYDAY_COVERAGE_V2) {
    this.entries = entries.filter((entry) => entry.source === coverageSource);
    const selectedIds = new Set(this.entries.map((entry) => entry.sourceId));
    this.base = coverageSource === "bls"
      ? new BlsAdapter("4.0 (2025)", undefined, selectedIds)
      : new UsdaFoodDataCentralAdapter(coverageSource === "usda_foundation" ? "foundation" : "sr_legacy", coverageSource === "usda_foundation" ? "2026-04-30" : "2018-04", undefined, selectedIds);
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
        yield { row: row.row, sourceId: row.food.sourceId, error: "record is not in the approved Everyday Coverage v2 manifest" };
        continue;
      }
      const originalName = normalizeSearch(row.food.originalName);
      const missingTokens = entry.expectedNameTokens.filter((token) => !originalName.includes(normalizeSearch(token)));
      if (missingTokens.length) {
        yield { row: row.row, sourceId: row.food.sourceId, error: `source name does not match approved identity tokens: ${missingTokens.join(", ")}` };
        continue;
      }
      const targetsSourceIdentity = entry.aliasTarget.kind === "source_identity";
      const names = targetsSourceIdentity
        ? Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, aliases[0]]))
        : {};
      const synonyms = targetsSourceIdentity
        ? Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, [...new Set(aliases)]]))
        : row.food.synonyms;
      const food: ImportFood = { ...row.food, names: { ...(row.food.names ?? {}), ...names }, synonyms };
      seen.add(entry.sourceId);
      this.resolvedFoods.push(food);
      yield { ...row, food };
    }
    for (const entry of this.entries) {
      if (!seen.has(entry.sourceId) && !encountered.has(entry.sourceId)) {
        yield { row: 0, sourceId: entry.sourceId, error: `approved Everyday Coverage v2 source record was not resolved: ${entry.key}` };
      }
    }
  }
}

export function auditEverydayMustFind(foods: readonly ImportFood[]): EverydayMustFindAudit {
  const byIdentity = new Map(foods.map((food) => [`${food.source}:${food.sourceId}`, food]));
  const manifestByIdentity = new Map(EVERYDAY_COVERAGE_V2.map((entry) => [`${entry.source === "bls" ? "bls" : "usda_fdc"}:${entry.sourceId}`, entry]));
  const cases = EVERYDAY_SEARCH_CORPUS.filter((item) => item.expectedSource && item.expectedSourceId);
  const failed = cases.flatMap((item) => {
    const food = byIdentity.get(`${item.expectedSource}:${item.expectedSourceId}`);
    const entry = manifestByIdentity.get(`${item.expectedSource}:${item.expectedSourceId}`);
    const representedTerms = new Set(Object.values(entry?.aliases ?? {}).flat().map(normalizeSearch));
    if (food && entry && representedTerms.has(normalizeSearch(item.query))) return [];
    return [{ concept: item.expectedConcept, query: item.query, source: item.expectedSource!, sourceId: item.expectedSourceId! }];
  });
  return { total: cases.length, passed: cases.length - failed.length, failed };
}
