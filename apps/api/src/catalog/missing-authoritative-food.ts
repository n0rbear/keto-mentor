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
  source: "manufacturer" | "open_database";
  sourceType: "official_manufacturer" | "official_national_food_composition_database";
  sourceOwner: string;
  sourceId?: string;
  category: string;
  canonicalUrls?: string[];
  basisEvidenceUrl?: string;
};

function profileFor(context: MissingFoodContext): ProductProfile | null {
  const text = normalizeSearch(`${context.originalIdentity} ${context.rawIngredient ?? ""} ${context.canonicalIdentity}`);
  if (/celery leaves|zellerzold|zeller level/.test(text)) return {
    key: "myfcd-celery-leaves-105022", sourceName: "Celery leaves (Daun seladeri)", domains: ["myfcd.moh.gov.my"],
    query: "site:myfcd.moh.gov.my celery daun seladeri 105022 nutrient composition", identityTerms: [["celery", "daun", "seladeri"]],
    aliases: ["zellerzöld", "zellerlevél", "celery leaves", "daun seladeri"],
    source: "open_database", sourceType: "official_national_food_composition_database", sourceOwner: "Malaysian Ministry of Health MyFCD", sourceId: "105022", category: "Vegetables and vegetable products",
    canonicalUrls: ["https://myfcd.moh.gov.my/index.php/1997-food-compositon-database/159-celery-%28daun-seladeri%29-%3B-apium-graveolens.html"],
    basisEvidenceUrl: "https://myfcd.moh.gov.my/myfcd97/"
  };
  if (!text.includes("paprika paste")) return null;
  if (/csipos|darat|hot|eros/.test(text)) return {
    key: "univer-eros-pista", sourceName: "Univer Erős Pista", domains: ["univer.ro", "univer.hu"],
    query: "Univer Erős Pista official nutrition 100g", identityTerms: [["eros", "pista"], ["ardei", "iute", "tocat"]],
    aliases: ["csípős daráltpaprika-krém", "erős pista", "hot Hungarian paprika paste"],
    source: "manufacturer", sourceType: "official_manufacturer", sourceOwner: "Univer", category: "Paprika paste"
  };
  if (/pritamin|sweet|csemege/.test(text)) return {
    key: "univer-piros-arany-csemege", sourceName: "Univer Piros Arany csemege", domains: ["univer.ro", "univer.hu"],
    query: "Univer Piros Arany csemege official nutrition 100g", identityTerms: [["piros", "arany"], ["pasta", "ardei", "dulce"]],
    aliases: ["pritaminpaprika-krém", "piros arany csemege", "sweet Hungarian paprika paste"],
    source: "manufacturer", sourceType: "official_manufacturer", sourceOwner: "Univer", category: "Paprika paste",
    canonicalUrls: ["https://www.univer.ro/produse/pasta-ardei-dulce-piros-arany/"]
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

function energyKcalAfter(text: string): number | null {
  const explicit = text.match(/(?:Conținut energetic|Energy|Energia)[^0-9]{0,80}(?:[0-9]+(?:[.,][0-9]+)?\s*kJ\s*[/ ]\s*)?([0-9]+(?:[.,][0-9]+)?)\s*kcal/i);
  if (explicit) return Number(explicit[1].replace(",", "."));
  const labelledPair = text.match(/(?:Conținut energetic[^0-9]{0,40}kJ\s*[/]\s*kcal)[^0-9]{0,80}[0-9]+(?:[.,][0-9]+)?\s*[/]\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (labelledPair) return Number(labelledPair[1].replace(",", "."));
  return numberAfter(text, ["Energy", "Energia"]);
}

export function extractManufacturerPer100g(html: string, profile: ProductProfile, url: string, retrievedAt = new Date().toISOString(), basisEvidenceHtml?: string): ExternalFoodCandidate | null {
  const text = htmlToEvidenceText(html);
  const basisText = basisEvidenceHtml ? htmlToEvidenceText(basisEvidenceHtml) : text;
  const normalized = normalizeSearch(text);
  if (!/(?:100\s*g|100g|value\s+per\s+100\s*g)/i.test(basisText) || !profile.identityTerms.some((terms) => terms.every((term) => normalized.includes(normalizeSearch(term))))) return null;
  const kcal = energyKcalAfter(text);
  const fat = numberAfter(text, ["Grăsimi(?: din care)?", "Fat", "Zsír"]);
  const carbs = numberAfter(text, ["Glucide(?: din care)?", "Carbohydrate", "CHO", "Szénhidrát"]);
  const fiber = numberAfter(text, ["Fibre", "Fiber", "Élelmi rost"]);
  const protein = numberAfter(text, ["Proteine", "Protein", "Fehérje"]);
  if ([kcal, fat, carbs, fiber, protein].some((value) => value == null)) return null;
  const sourceId = createHash("sha256").update(new URL(url).toString()).digest("hex").slice(0, 32);
  const candidate: ExternalFoodCandidate = {
    source: profile.source, sourceId: profile.sourceId ?? sourceId, originalName: profile.sourceName, name: profile.sourceName,
    names: { hu: profile.sourceName, en: profile.sourceName }, synonyms: { hu: profile.aliases }, category: profile.category,
    kcalPer100g: kcal!, fatPer100g: fat!, proteinPer100g: protein!, carbsPer100g: carbs!, fiberPer100g: fiber!, nutrients: [],
    provenance: { sourceType: profile.sourceType, sourceName: profile.sourceOwner, sourceFoodName: profile.sourceName, sourceUrl: url, sourceBasisUrl: profile.basisEvidenceUrl ?? url, sourceIdentifier: profile.sourceId ?? sourceId, retrievedAt, originalBasis: "100 g", normalizedBasis: "100 g", extractionMethod: "deterministic_labeled_html", identityConfidence: 1, nutritionValidationStatus: "complete_explicit_per_100g", nutrientSources: { energy: url, fat: url, carbohydrate: url, fiber: url, protein: url } },
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
    const urls = [...new Set([...results.map((result) => result.url), ...(profile.canonicalUrls ?? [])])];
    let basisEvidenceHtml: string | undefined;
    if (profile.basisEvidenceUrl) {
      calls += 1;
      try { basisEvidenceHtml = (await fetchPublicHtml(profile.basisEvidenceUrl, this.fetchDependencies)).html; }
      catch { this.negativeCache.set(cacheKey); return { status: "unresolved", reason: "invalid_source_evidence", externalCalls: calls }; }
    }
    for (const url of urls) {
      let parsed: URL;
      try { parsed = new URL(url); } catch { continue; }
      if (parsed.protocol !== "https:" || !profile.domains.includes(parsed.hostname.replace(/^www\./, ""))) continue;
      calls += 1;
      try {
        const page = await fetchPublicHtml(url, this.fetchDependencies);
        const candidate = extractManufacturerPer100g(page.html, profile, page.finalUrl, new Date().toISOString(), basisEvidenceHtml);
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
