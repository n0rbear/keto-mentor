import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { buildSearchText, normalizeSearch } from "./normalize.js";
import { persistCandidate, validateExternalCandidate, type ExternalFoodCandidate } from "./external-food.js";
import type { WebKnowledgeSearchProvider } from "../web-knowledge/web-knowledge-search-provider.js";
import { NegativeSearchCache } from "../web-knowledge/negative-search-cache.js";
import { fetchPublicHtml, type SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";

function htmlToEvidenceText(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/\s+/g, " ").trim().slice(0, 100_000);
}

type MissingPrisma = Pick<PrismaClient, "food" | "foodAlias" | "nutrient" | "foodNutrient" | "$transaction">;

export type MissingFoodContext = {
  canonicalIdentity: string;
  originalIdentity: string;
  rawIngredient?: string;
  recipeTitle?: string;
  preparation?: string;
  locale?: string;
};

export type MissingFoodResolution =
  | { status: "resolved"; food: any; provenance: unknown; externalCalls: number }
  | { status: "unresolved"; reason: "authoritative_source_not_found" | "invalid_source_evidence" | "negative_cache"; externalCalls: number };

type ProductProfile = {
  key: string;
  sourceName: string;
  domains: string[];
  query: string;
  identityTerms: string[][];
  aliases: string[];
};

function profileFor(context: MissingFoodContext): ProductProfile | null {
  const text = normalizeSearch(`${context.originalIdentity} ${context.rawIngredient ?? ""} ${context.canonicalIdentity}`);
  if (!text.includes("paprika paste")) return null;
  if (/csipos|darat|hot|eros/.test(text)) return {
    key: "univer-eros-pista", sourceName: "Univer Erős Pista", domains: ["univer.ro", "univer.hu"],
    query: "Univer Erős Pista official nutrition 100g", identityTerms: [["eros", "pista"], ["ardei", "iute", "tocat"]],
    aliases: ["csípős daráltpaprika-krém", "erős pista", "hot Hungarian paprika paste"]
  };
  if (/pritamin|sweet|csemege/.test(text)) return {
    key: "univer-piros-arany-csemege", sourceName: "Univer Piros Arany csemege", domains: ["univer.ro", "univer.hu"],
    query: "Univer Piros Arany csemege official nutrition 100g", identityTerms: [["piros", "arany"], ["pasta", "ardei", "dulce"]],
    aliases: ["pritaminpaprika-krém", "piros arany csemege", "sweet Hungarian paprika paste"]
  };
  return null;
}

function numberAfter(text: string, labels: string[]): number | null {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[^0-9]{0,80}([0-9]+(?:[.,][0-9]+)?)\\s*(?:g|kcal)`, "i"));
    if (match) return Number(match[1].replace(",", "."));
  }
  return null;
}

export function extractManufacturerPer100g(html: string, profile: ProductProfile, url: string, retrievedAt = new Date().toISOString()): ExternalFoodCandidate | null {
  const text = htmlToEvidenceText(html);
  const normalized = normalizeSearch(text);
  if (!/(100\s*g|100g)/i.test(text) || !profile.identityTerms.some((terms) => terms.every((term) => normalized.includes(normalizeSearch(term))))) return null;
  const kcal = numberAfter(text, ["Conținut energetic(?: kJ/kcal)?(?:[^0-9]{0,20}[0-9]+\\s*(?:kJ)?\\s*[/]?)?", "Energy", "Energia"]);
  const fat = numberAfter(text, ["Grăsimi(?: din care)?", "Fat", "Zsír"]);
  const carbs = numberAfter(text, ["Glucide(?: din care)?", "Carbohydrate", "Szénhidrát"]);
  const fiber = numberAfter(text, ["Fibre", "Fiber", "Élelmi rost"]);
  const protein = numberAfter(text, ["Proteine", "Protein", "Fehérje"]);
  if ([kcal, fat, carbs, fiber, protein].some((value) => value == null)) return null;
  const sourceId = createHash("sha256").update(new URL(url).toString()).digest("hex").slice(0, 32);
  const candidate: ExternalFoodCandidate = {
    source: "manufacturer", sourceId, originalName: profile.sourceName, name: profile.sourceName,
    names: { hu: profile.sourceName, en: profile.sourceName }, synonyms: { hu: profile.aliases }, category: "Paprika paste",
    kcalPer100g: kcal!, fatPer100g: fat!, proteinPer100g: protein!, carbsPer100g: carbs!, fiberPer100g: fiber!, nutrients: [],
    provenance: { sourceType: "official_manufacturer", sourceName: "Univer", sourceFoodName: profile.sourceName, sourceUrl: url, sourceIdentifier: sourceId, retrievedAt, originalBasis: "100 g", normalizedBasis: "100 g", extractionMethod: "deterministic_labeled_html", identityConfidence: 1, nutritionValidationStatus: "complete_explicit_per_100g" },
    sourceUrl: url, normalizedName: normalizeSearch(profile.sourceName), nutrientBasis: "per_100_g", retrievedAt,
    confidence: 1, matchPolicy: "exact_normalized_name", language: "hu"
  };
  return candidate;
}

export class MissingAuthoritativeFoodResolver {
  constructor(
    private readonly searchProvider: WebKnowledgeSearchProvider,
    private readonly negativeCache = new NegativeSearchCache(6 * 60 * 60 * 1000),
    private readonly fetchDependencies: SafeFetcherDependencies = {}
  ) {}

  async resolve(prisma: MissingPrisma, context: MissingFoodContext): Promise<MissingFoodResolution> {
    const profile = profileFor(context);
    const cacheKey = normalizeSearch(`${context.locale ?? "und"}:${context.originalIdentity}`);
    if (this.negativeCache.has(cacheKey)) return { status: "unresolved", reason: "negative_cache", externalCalls: 0 };
    if (!profile || this.searchProvider.id === "disabled") {
      this.negativeCache.set(cacheKey);
      return { status: "unresolved", reason: "authoritative_source_not_found", externalCalls: 0 };
    }
    let calls = 1;
    let results;
    try { results = await this.searchProvider.search({ query: profile.query, maxResults: 5, includeDomains: profile.domains }); }
    catch { this.negativeCache.set(cacheKey); return { status: "unresolved", reason: "authoritative_source_not_found", externalCalls: calls }; }
    for (const result of results) {
      let parsed: URL;
      try { parsed = new URL(result.url); } catch { continue; }
      if (parsed.protocol !== "https:" || !profile.domains.includes(parsed.hostname.replace(/^www\./, ""))) continue;
      calls += 1;
      try {
        const page = await fetchPublicHtml(result.url, this.fetchDependencies);
        const candidate = extractManufacturerPer100g(page.html, profile, page.finalUrl);
        const validated = candidate && validateExternalCandidate(candidate);
        if (!validated) continue;
        const existing = await prisma.food.findUnique({ where: { source_sourceId: { source: validated.source, sourceId: validated.sourceId } }, include: { servings: true } });
        if (existing) return { status: "resolved", food: existing, provenance: existing.provenance, externalCalls: calls };
        try {
          const food = await persistCandidate(prisma, validated);
          for (const alias of profile.aliases) {
            const normalizedAlias = normalizeSearch(alias);
            if (!normalizedAlias) continue;
            await prisma.foodAlias.upsert({ where: { foodId_normalizedAlias_locale: { foodId: food.id, normalizedAlias, locale: context.locale ?? "und" } }, update: {}, create: { foodId: food.id, alias, normalizedAlias, locale: context.locale ?? "und", kind: "dynamic_authoritative", confidence: 1, provenance: validated.provenance } });
          }
          return { status: "resolved", food: { ...food, searchText: buildSearchText(food) }, provenance: validated.provenance, externalCalls: calls };
        } catch (error: any) {
          if (error?.code === "P2002") {
            const raced = await prisma.food.findUnique({ where: { source_sourceId: { source: validated.source, sourceId: validated.sourceId } }, include: { servings: true } });
            if (raced) return { status: "resolved", food: raced, provenance: raced.provenance, externalCalls: calls };
          }
          throw error;
        }
      } catch { /* try the next allowlisted result */ }
    }
    this.negativeCache.set(cacheKey);
    return { status: "unresolved", reason: "invalid_source_evidence", externalCalls: calls };
  }
}
