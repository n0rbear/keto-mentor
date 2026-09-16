/**
 * DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK (2026-09-16).
 *
 * Pure types and pure validation/classification functions for the
 * last-resort web-evidence fallback. Nothing here performs I/O (no
 * fetch/search/AI call) — see web-evidence-fallback.ts for the orchestrator
 * and nutrition-evidence-extraction.ts for the extraction provider.
 *
 * HARD INVARIANT this whole subsystem exists to enforce: AI MAY find and
 * read nutrition data; AI MUST NEVER invent it. Every function here is a
 * mechanical (non-AI) check that a piece of claimed evidence is real,
 * consistent, and actually present in the source text — never a "trust the
 * model's JSON" shortcut.
 */

export type EvidenceSourceTier = "tier_a_official" | "tier_b_manufacturer" | "tier_c_institutional" | "discovery_only";

// Government / official food-composition-database domains. Pattern-based
// (TLD suffixes) plus a small, explicitly-documented, easily-extensible
// allowlist of known official non-.gov databases — deliberately NOT a giant
// hardcoded domain list: the TLD patterns generalize to any country's
// official database without needing a new entry per country.
const TIER_A_TLD_PATTERNS: RegExp[] = [
  /\.gov$/, /\.gov\.[a-z]{2,}$/, /\.europa\.eu$/, /\.admin\.ch$/, /\.canada\.ca$/, /\.bund\.de$/
];
// Known official government/institutional food-composition databases whose
// own domain does not match a TLD pattern above. Extend this list as new
// national databases are identified — each entry should be a real, verified
// official government-operated or government-commissioned dataset.
const TIER_A_KNOWN_DOMAINS = new Set<string>([
  "fdc.nal.usda.gov",
  "blsdb.de", // Bundeslebensmittelschlüssel (Max Rubner-Institut, DE)
  "frida.fooddata.dk", // Danish national food database (DTU)
  "ciqual.anses.fr" // French official food composition database (ANSES)
]);
// Recognized institutional/licensed nutrition databases — not government,
// but a maintained, citation-quality dataset. Reviewed periodically; not a
// substitute for tier A, and never preferred over it.
const TIER_C_KNOWN_DOMAINS = new Set<string>([]);

// A domain's own brand label sits one level higher when the TLD itself is
// multi-part ("co.uk", "com.au", ...) — the naive second-from-last split
// below would read "heinztohome.co.uk" as "co" instead of "heinztohome",
// wrongly falling through to discovery_only for a real manufacturer domain.
// Not an exhaustive public-suffix list (that dataset is much larger and
// changes independently of this app) — covers the common multi-part
// suffixes seen among manufacturer domains; extend as new ones are found.
const MULTI_PART_TLD_SUFFIXES = new Set<string>([
  "co.uk", "org.uk", "me.uk", "ltd.uk", "plc.uk",
  "co.jp", "ne.jp", "or.jp",
  "com.au", "net.au", "org.au",
  "co.nz", "co.za", "co.in", "co.kr", "co.il", "co.th", "co.id",
  "com.br", "com.mx", "com.ar", "com.sg", "com.hk", "com.tw", "com.cn",
  "com.co", "com.tr"
]);

function normalizedDomainLabel(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  if (parts.length < 2) return parts[0] ?? "";
  const lastTwo = parts.slice(-2).join(".");
  if (parts.length >= 3 && MULTI_PART_TLD_SUFFIXES.has(lastTwo)) {
    // second-level label ahead of a multi-part TLD, e.g. "heinztohome" from
    // "heinztohome.co.uk"
    return parts[parts.length - 3];
  }
  // second-level label, e.g. "univer" from "univer.hu" or "shop.univer.hu"
  return parts[parts.length - 2];
}

/**
 * A domain counts as a plausible manufacturer/brand domain for THIS request
 * only when its own registrable label is genuinely attested as a token of
 * the identity the user actually asked about (e.g. domain "univer.hu" for a
 * request naming "Univer Erős Pista") — never merely because the caller
 * marked the request as "branded". This mirrors isRelevantExternalCandidate's
 * token-overlap philosophy (external-food.ts) rather than a hardcoded brand
 * list, so it generalizes to any brand without a new entry per product.
 */
export function domainMatchesRequestedBrand(domain: string, requestedIdentity: string): boolean {
  const label = normalizedDomainLabel(domain);
  if (label.length < 3) return false;
  const identityTokens = requestedIdentity
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  if (identityTokens.length === 0) return false;

  // A label containing its own separator ("coca-cola", "tomato_ketchup")
  // reads as several words glued together — a legitimate brand domain only
  // when EVERY one of those words is itself part of the requested identity
  // (e.g. "coca-cola.com" for "Coca-Cola"). An unrelated word tacked on with
  // a separator ("nutella-nutrition.example" for "Nutella") is the classic
  // impersonation pattern this gate exists to reject: anyone can register
  // that string with no brand affiliation at all.
  const labelSubTokens = label.split(/[^a-z0-9]+/).filter((token) => token.length > 0);
  if (labelSubTokens.length > 1) {
    return labelSubTokens.every((subToken) =>
      identityTokens.some((token) => token === subToken || token.startsWith(subToken) || subToken.startsWith(token))
    );
  }

  // No internal separator: allow a brand token glued directly onto a generic
  // suffix with no boundary at all (e.g. "heinztohome" for "Heinz") — a far
  // more brand-specific string for an unrelated registrant to have picked
  // than a hyphenated one.
  return identityTokens.some((token) => token === label || token.startsWith(label) || label.startsWith(token));
}

export function classifySourceTier(domain: string, requestedIdentity: string): EvidenceSourceTier {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  if (TIER_A_TLD_PATTERNS.some((pattern) => pattern.test(normalized)) || TIER_A_KNOWN_DOMAINS.has(normalized)) return "tier_a_official";
  if (domainMatchesRequestedBrand(normalized, requestedIdentity)) return "tier_b_manufacturer";
  if (TIER_C_KNOWN_DOMAINS.has(normalized)) return "tier_c_institutional";
  return "discovery_only";
}

// discovery_only sources are never authoritative — they exist purely to help
// a search engine locate a real source; the actual nutrition numbers must
// come from a tier A/B/C page.
export function isAuthoritativeTier(tier: EvidenceSourceTier): boolean {
  return tier !== "discovery_only";
}

export type ExtractedNutritionValue = { value: number; quote: string } | null;

export type ExtractedNutritionBasis = { amountGrams: number; quote: string } | null;

// Raw shape the extraction provider (LLM-grounded or deterministic JSON-LD
// parser) produces — every numeric claim carries its own verbatim supporting
// quote so it can be mechanically checked against the actual fetched text.
export type ExtractedNutritionEvidence = {
  sourceFoodName: string;
  basis: ExtractedNutritionBasis;
  kcal: ExtractedNutritionValue;
  protein: ExtractedNutritionValue;
  fat: ExtractedNutritionValue;
  carbs: ExtractedNutritionValue;
  // Distinct from "0g fiber": null means the source never stated a fiber
  // value at all and must never be treated as zero (Phase 6's hard
  // requirement — this app computes netCarbs = carbs - fiber, and a keto
  // tracker silently assuming fiber=0 when it is merely unknown produces a
  // falsely-inflated netCarbs, the wrong direction for user trust/safety).
  fiber: ExtractedNutritionValue;
  extractionMethod: "json_ld" | "html_table" | "llm_grounded";
};

// The fully-validated, per-100g-normalized, grounded evidence — the only
// shape allowed to reach persistence.
export type NutritionEvidence = {
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  sourceTier: EvidenceSourceTier;
  retrievedAt: string;
  requestedIdentity: string;
  canonicalIdentity: string;
  sourceFoodName: string;
  basisAmountGrams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  extractionMethod: "json_ld" | "html_table" | "llm_grounded";
  evidenceExcerpt: string;
  energyConsistent: boolean;
  confidence: number;
};

/**
 * Mechanical grounding check (Phase 11 — load-bearing): a claimed quote is
 * only trusted if it is an actual, verbatim (whitespace/case-insensitive)
 * substring of the text that was really fetched. This runs in code, not the
 * model — an LLM that "returns valid JSON" is not sufficient trust; only a
 * quote that genuinely appears in the source text is.
 *
 * P0 grounding-hardening review (2026-09-16): text-presence alone is
 * necessary but NOT sufficient — a quote can be a real, verbatim substring
 * of the page while having nothing to do with the claimed nutrient (e.g. the
 * LLM cites "Serving size 100 g" as "evidence" for a hallucinated protein
 * value). See isNutrientGrounded below, which adds the missing bindings:
 * the quote must also contain the claimed NUMBER itself and a recognized
 * LABEL for that specific nutrient — never just any text from the page.
 */
export function isGroundedInSource(quote: string, sourceText: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
  const normalizedQuote = normalize(quote);
  if (normalizedQuote.length < 2) return false;
  return normalize(sourceText).includes(normalizedQuote);
}

export type GroundedNutrientKey = "kcal" | "protein" | "fat" | "carbs" | "fiber";

// Multilingual (HU/DE/EN) label tokens per nutrient — deliberately generic
// vocabulary, not food-specific. Each nutrient's token list is disjoint from
// every other's, so a calories/protein swap (citing a "protein 20g" quote as
// evidence for kcal, or vice versa) fails the label check for the field it
// was actually claimed against.
const NUTRIENT_LABEL_TOKENS: Record<GroundedNutrientKey, readonly string[]> = {
  kcal: ["kcal", "calorie", "calories", "energy", "energia", "energiaérték", "kalória", "kalóriák", "energie", "brennwert", "kalorien"],
  protein: ["protein", "proteins", "fehérje", "eiweiß", "eiweiss"],
  fat: ["fat", "fats", "zsír", "zsírtartalom", "fett"],
  carbs: ["carbohydrate", "carbohydrates", "carb", "carbs", "szénhidrát", "kohlenhydrat", "kohlenhydrate"],
  fiber: ["fiber", "fibre", "dietary fiber", "dietary fibre", "rost", "ballaststoff", "ballaststoffe", "élelmi rost", "rosttartalom"]
};

// Accepts "20", "20.5", "20,5" (decimal comma), and tolerates the quote
// spelling the number with or without a trailing ".0" — but the digits
// themselves must appear, not merely be inferable.
function quoteContainsValue(quote: string, value: number): boolean {
  const rounded2 = Math.round(value * 100) / 100;
  const candidates = new Set([String(value), String(rounded2), rounded2.toFixed(1), rounded2.toFixed(2), rounded2.toFixed(0)]);
  const normalizedQuote = quote.toLowerCase();
  for (const candidate of candidates) {
    if (normalizedQuote.includes(candidate) || normalizedQuote.includes(candidate.replace(".", ","))) return true;
  }
  return false;
}

// A gram unit attached directly to its number ("17g)") or separated by a
// space ("17 g)") — real-world serving sizes are commonly written either
// way, so the check must not require a standalone " g" token (a bare \bg\b
// never matches "17g": the digit right before "g" is itself a word
// character, so there is no boundary between them).
function hasGramUnit(quote: string): boolean {
  return /\d[\d.,]*\s*g\b/i.test(quote);
}

// Basic unit sanity: a gram-denominated macro field (protein/fat/carbs/fiber)
// must not be grounded by a quote whose number is explicitly tagged "mg"
// with no accompanying gram figure — catches "20 mg" being misread as 20 g.
function hasConflictingMilligramUnit(quote: string, nutrient: GroundedNutrientKey): boolean {
  if (nutrient === "kcal") return false;
  const mgMatch = /\d[\d.,]*\s*mg\b/i.test(quote);
  return mgMatch && !hasGramUnit(quote);
}

/**
 * The hardened, nutrient-aware grounding check: binds NUTRIENT LABEL + VALUE
 * + UNIT together, not just "this text exists on the page somewhere". A
 * quote passes only if it (a) is a real verbatim substring of the fetched
 * text, (b) contains the claimed numeric value itself, (c) contains a
 * recognized label for THIS specific nutrient (rejecting cross-nutrient
 * mix-ups), and (d) is not unit-conflicting (mg cited for a gram field).
 * This is what validateAndNormalizeEvidence now requires for every macro.
 */
export function isNutrientGrounded(nutrient: GroundedNutrientKey, value: number, quote: string, sourceText: string): boolean {
  if (!isGroundedInSource(quote, sourceText)) return false;
  if (!quoteContainsValue(quote, value)) return false;
  if (!NUTRIENT_LABEL_TOKENS[nutrient].some((token) => quote.toLowerCase().includes(token))) return false;
  if (hasConflictingMilligramUnit(quote, nutrient)) return false;
  return true;
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// Same physical/plausibility bounds validateExternalCandidate (external-food.ts)
// already applies to USDA/OFF candidates — reused verbatim so a web-evidence
// Food can never be more permissive than an authoritative-adapter Food.
export function withinPhysicalBounds(values: { kcal: number; protein: number; fat: number; carbs: number; fiber: number }): boolean {
  return finiteNonNegative(values.kcal) && finiteNonNegative(values.protein) && finiteNonNegative(values.fat)
    && finiteNonNegative(values.carbs) && finiteNonNegative(values.fiber)
    && values.kcal <= 1_000 && values.protein <= 100 && values.fat <= 100 && values.carbs <= 100 && values.fiber <= 100;
}

/**
 * Anomaly detection only (Phase 12) — never replaces the source's own
 * stated kcal with a calculated one. A gross mismatch (unit confusion such
 * as kJ misread as kcal, or a per-serving/per-100g mixup) is rejected;
 * ordinary differences from fiber, polyols, organic acids, and rounding are
 * tolerated with a generous band.
 */
export function isEnergyConsistent(kcal: number, protein: number, fat: number, carbs: number): boolean {
  const derived = protein * 4 + carbs * 4 + fat * 9;
  const tolerance = Math.max(50, kcal * 0.35, derived * 0.35);
  return Math.abs(derived - kcal) <= tolerance;
}

/**
 * Normalizes extracted-but-ungrounded values to null (never silently drops
 * the whole evidence object for one bad field) and basis conversion to
 * per-100g. Returns null if the basis itself isn't grounded/known, or if
 * any of the four REQUIRED macros (kcal/protein/fat/carbs) is missing or
 * ungrounded, or if fiber is missing (Phase 6: never fabricate fiber=0).
 * Does not perform the semantic-identity check or persistence — purely the
 * mechanical grounding + basis + bounds + sanity gate.
 */
export function validateAndNormalizeEvidence(
  extracted: ExtractedNutritionEvidence,
  sourceText: string,
  source: { sourceUrl: string; sourceDomain: string; sourceTitle: string; sourceTier: EvidenceSourceTier; retrievedAt: string; requestedIdentity: string; canonicalIdentity: string }
): NutritionEvidence | null {
  if (!isAuthoritativeTier(source.sourceTier)) return null;
  // The basis quote must be grounded AND itself contain the claimed gram
  // amount AND a mass unit — "Serving size 100 g" style, not a bare number.
  if (!extracted.basis || !isGroundedInSource(extracted.basis.quote, sourceText) || extracted.basis.amountGrams <= 0) return null;
  if (!quoteContainsValue(extracted.basis.quote, extracted.basis.amountGrams) || !hasGramUnit(extracted.basis.quote)) return null;

  // P0 grounding-hardening review (2026-09-16): each macro now requires the
  // FULL binding (label + value + unit), not merely text-presence anywhere
  // on the page — see isNutrientGrounded's own doc for the exact reasoning
  // and the adversarial cases this specifically closes (unrelated numbers,
  // calories/protein swaps, mg-for-g misreads).
  const groundedValue = (nutrient: GroundedNutrientKey, field: ExtractedNutritionValue): number | null => {
    if (!field) return null;
    if (!isNutrientGrounded(nutrient, field.value, field.quote, sourceText)) return null;
    return field.value;
  };

  const kcalRaw = groundedValue("kcal", extracted.kcal);
  const proteinRaw = groundedValue("protein", extracted.protein);
  const fatRaw = groundedValue("fat", extracted.fat);
  const carbsRaw = groundedValue("carbs", extracted.carbs);
  const fiberRaw = groundedValue("fiber", extracted.fiber);
  // Required macros: any missing/ungrounded value means the evidence is
  // incomplete — never filled in from model memory.
  if (kcalRaw == null || proteinRaw == null || fatRaw == null || carbsRaw == null) return null;
  // Fiber unknown -> reject rather than assume 0 (see ExtractedNutritionEvidence.fiber doc).
  if (fiberRaw == null) return null;

  const factor = 100 / extracted.basis.amountGrams;
  const kcalPer100g = kcalRaw * factor;
  const proteinPer100g = proteinRaw * factor;
  const fatPer100g = fatRaw * factor;
  const carbsPer100g = carbsRaw * factor;
  const fiberPer100g = fiberRaw * factor;

  if (!withinPhysicalBounds({ kcal: kcalPer100g, protein: proteinPer100g, fat: fatPer100g, carbs: carbsPer100g, fiber: fiberPer100g })) return null;
  const energyConsistent = isEnergyConsistent(kcalPer100g, proteinPer100g, fatPer100g, carbsPer100g);
  if (!energyConsistent) return null; // gross mismatch: likely unit confusion, reject outright rather than merely flag

  const excerptParts = [extracted.basis.quote, extracted.kcal?.quote, extracted.protein?.quote, extracted.fat?.quote, extracted.carbs?.quote, extracted.fiber?.quote]
    .filter((value): value is string => Boolean(value));
  const evidenceExcerpt = [...new Set(excerptParts)].join(" | ").slice(0, 2_000);

  return {
    sourceUrl: source.sourceUrl,
    sourceDomain: source.sourceDomain,
    sourceTitle: source.sourceTitle,
    sourceTier: source.sourceTier,
    retrievedAt: source.retrievedAt,
    requestedIdentity: source.requestedIdentity,
    canonicalIdentity: source.canonicalIdentity,
    sourceFoodName: extracted.sourceFoodName,
    basisAmountGrams: extracted.basis.amountGrams,
    kcalPer100g, proteinPer100g, fatPer100g, carbsPer100g, fiberPer100g,
    extractionMethod: extracted.extractionMethod,
    evidenceExcerpt,
    energyConsistent,
    confidence: source.sourceTier === "tier_a_official" ? 0.9 : source.sourceTier === "tier_b_manufacturer" ? 0.85 : 0.7
  };
}
