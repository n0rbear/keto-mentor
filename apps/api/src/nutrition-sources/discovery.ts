export type NutritionSourceCandidate = {
  url: string;
  domain: string;
  title: string;
  sourceKind: "bls" | "usda" | "government" | "manufacturer" | "structured_database" | "other";
  sourceIdentifier?: string;
  snippet?: string;
};

export interface NutritionSourceSearchProvider {
  readonly id: string;
  search(query: string, signal?: AbortSignal): Promise<readonly NutritionSourceCandidate[]>;
}

export type NutritionSourceProvenance = {
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  retrievedAt: string;
  originalFoodName: string;
  nutritionBasis: "per_100g";
  extractionMethod: "structured_data" | "official_api" | "admin_reviewed";
  confidence: number;
  sourceIdentifier?: string;
  sourceVersion?: string;
};

const PRIORITY: Record<NutritionSourceCandidate["sourceKind"], number> = {
  bls: 1, usda: 2, government: 3, manufacturer: 4, structured_database: 5, other: 6
};

export function rankSourceCandidates(candidates: readonly NutritionSourceCandidate[]) {
  return [...candidates]
    .filter((candidate) => /^https:\/\//i.test(candidate.url))
    .sort((a, b) => PRIORITY[a.sourceKind] - PRIORITY[b.sourceKind]);
}

export function validateNutritionProvenance(value: NutritionSourceProvenance) {
  if (!/^https:\/\//i.test(value.sourceUrl)) throw new Error("source_url_must_be_https");
  if (value.nutritionBasis !== "per_100g") throw new Error("unsupported_nutrition_basis");
  if (!(value.confidence >= 0 && value.confidence <= 1)) throw new Error("invalid_confidence");
  return value;
}

// Search results are discovery metadata only. Numerical nutrition extraction is
// deliberately outside this interface and must use the fetched source page/API.
export class DisabledWebSearchProvider implements NutritionSourceSearchProvider {
  readonly id = "disabled";
  async search(): Promise<readonly NutritionSourceCandidate[]> { return []; }
}
