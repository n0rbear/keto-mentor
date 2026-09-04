import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "../db.js";
import { assertProductionDatabaseSchema } from "../database-url.js";
import { aliasesForImportedFood } from "./import-foods.js";
import { EverydayCoverageAdapter, auditEverydayMustFind } from "./everyday-coverage-adapter.js";
import { parseEverydayCoverageCliOptions } from "./everyday-coverage-cli-options.js";
import { EVERYDAY_COVERAGE_V2, EVERYDAY_SEARCH_CORPUS } from "./everyday-coverage-manifest.js";
import { importFoods } from "./import-foods.js";
import { applyEverydayExternalAliasTargets, assertEverydayAliasTargetsExist, planEverydayAliasUpserts } from "./everyday-alias-overlay.js";
import { auditCrossSourceCollisions, auditProjectedEuropeanEssentials, auditProjectedMealInput, auditProjectedSearch, auditShortAliasSafety } from "./everyday-projected-audit.js";
import { planImportFromSnapshot, type CatalogReadOnlySnapshot } from "./import-plan.js";
import { buildProjectedCatalog, type ProjectedCatalog, type ProjectedCatalogAlias, type ProjectedCatalogFood } from "./projected-catalog.js";
import { NUTRIENTS } from "./nutrient-mapping.js";

const options = parseEverydayCoverageCliOptions(process.argv.slice(2));
if (options.apply) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required in write mode");
  assertProductionDatabaseSchema(databaseUrl, "production");
}

const adapters = [
  { adapter: new EverydayCoverageAdapter("bls"), path: resolve(options.blsFile) },
  { adapter: new EverydayCoverageAdapter("usda_sr_legacy"), path: resolve(options.srDirectory) },
  { adapter: new EverydayCoverageAdapter("usda_foundation"), path: resolve(options.foundationDirectory) }
];

try {
  const snapshot = options.snapshotFile
    ? JSON.parse(await readFile(resolve(options.snapshotFile), "utf8")) as CatalogReadOnlySnapshot
    : undefined;
  if (snapshot && snapshot.schema !== "ketomentor") throw new Error("read-only snapshot must target the ketomentor schema");
  const knownNutrients = new Set(snapshot?.nutrientKeys ?? Object.keys(NUTRIENTS));
  const liveCatalog = snapshot ? undefined : {
    foods: await prisma.food.findMany({
      where: { createdById: null },
      include: { servings: { orderBy: [{ isEstimated: "asc" }, { confidence: "desc" }] } }
    }) as unknown as ProjectedCatalogFood[],
    aliases: await prisma.foodAlias.findMany() as unknown as ProjectedCatalogAlias[]
  };
  const currentCatalog: ProjectedCatalog | undefined = snapshot?.foods && snapshot.aliases
    ? { foods: snapshot.foods, aliases: snapshot.aliases as ProjectedCatalogAlias[] }
    : liveCatalog;
  if (options.apply) await assertEverydayAliasTargetsExist(prisma);
  const reports = [];
  const foods = [];
  for (const { adapter, path } of adapters) {
    if (snapshot) {
      const planned = await planImportFromSnapshot(adapter, path, snapshot, knownNutrients);
      reports.push(planned.report);
      foods.push(...planned.foods);
    } else {
      const report = await importFoods(prisma, adapter, path, {
        dryRun: !options.apply,
        batchSize: options.batchSize,
        onProgress: (current) => console.error(JSON.stringify({
          event: "everyday_coverage_progress",
          source: current.source,
          dryRun: current.dryRun,
          processed: current.processed,
          valid: current.validRecords,
          skipped: current.skippedRecords
        }))
      });
      reports.push(report);
      foods.push(...adapter.resolvedFoods);
    }
  }

  const aliasPlan = currentCatalog
    ? planEverydayAliasUpserts(foods, currentCatalog.foods, currentCatalog.aliases)
    : undefined;
  const projectedCatalog = currentCatalog ? buildProjectedCatalog(currentCatalog, foods) : undefined;
  const currentSearch = currentCatalog ? await auditProjectedSearch(currentCatalog) : undefined;
  const currentLegacyCompatibility = currentCatalog ? await auditProjectedEuropeanEssentials(currentCatalog) : undefined;
  const projectedSearch = projectedCatalog ? await auditProjectedSearch(projectedCatalog) : undefined;
  const legacyCompatibility = projectedCatalog ? await auditProjectedEuropeanEssentials(projectedCatalog) : undefined;
  const legacySeverity = { CORRECT: 0, AMBIGUOUS: 1, WRONG_TOP_RESULT: 2, MISSING: 3 } as const;
  const currentLegacyByKey = new Map(currentLegacyCompatibility?.results.map((result) => [result.key, result]));
  const legacyRegressions = legacyCompatibility?.results.filter((result) => {
    const current = currentLegacyByKey.get(result.key);
    return current && legacySeverity[result.category as keyof typeof legacySeverity] > legacySeverity[current.category as keyof typeof legacySeverity];
  }) ?? [];
  const projectedMealInput = projectedCatalog ? await auditProjectedMealInput(projectedCatalog) : undefined;
  const preFixEntries = EVERYDAY_COVERAGE_V2.map((entry) => ({ ...entry, aliasTarget: { kind: "source_identity" as const } }));
  const entryByIdentity = new Map(EVERYDAY_COVERAGE_V2.map((entry) => [`${entry.source === "bls" ? "bls" : "usda_fdc"}:${entry.sourceId}`, entry]));
  const preFixFoods = foods.map((food) => {
    const entry = entryByIdentity.get(`${food.source}:${food.sourceId}`);
    if (!entry || entry.aliasTarget.kind !== "food_id") return food;
    return {
      ...food,
      names: { ...(food.names ?? {}), ...Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, aliases[0]])) },
      synonyms: { ...(food.synonyms ?? {}), ...Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, [...aliases]])) }
    };
  });
  const preFixCatalog = currentCatalog ? buildProjectedCatalog(currentCatalog, preFixFoods, preFixEntries) : undefined;
  const collisionAudit = currentCatalog && projectedCatalog && preFixCatalog
    ? await auditCrossSourceCollisions(currentCatalog, projectedCatalog, preFixCatalog)
    : undefined;
  const shortAliasSafety = projectedCatalog ? await auditShortAliasSafety(projectedCatalog) : undefined;
  if (options.apply) await applyEverydayExternalAliasTargets(prisma);

  const mustFind = auditEverydayMustFind(foods);
  const totals = reports.reduce((sum, report) => ({
    inputRecords: sum.inputRecords + report.inputRecords,
    validRecords: sum.validRecords + report.validRecords,
    skippedRecords: sum.skippedRecords + report.skippedRecords,
    duplicateRecords: sum.duplicateRecords + report.duplicateRecords,
    foodsToCreate: sum.foodsToCreate + report.foodsToCreate,
    foodsToUpdate: sum.foodsToUpdate + report.foodsToUpdate,
    nutrientsToCreate: sum.nutrientsToCreate + report.nutrientsToCreate,
    foodNutrientsExpected: sum.foodNutrientsExpected + report.foodNutrientsExpected,
    estimatedGrowthBytes: sum.estimatedGrowthBytes + report.estimatedGrowthBytes
  }), { inputRecords: 0, validRecords: 0, skippedRecords: 0, duplicateRecords: 0, foodsToCreate: 0, foodsToUpdate: 0, nutrientsToCreate: 0, foodNutrientsExpected: 0, estimatedGrowthBytes: 0 });
  const aliasRows = foods.flatMap(aliasesForImportedFood);
  const aliasCounts = Object.fromEntries(["hu", "de", "en"].map((locale) => [locale, aliasRows.filter((alias) => alias.locale === locale).length]));

  console.log(JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    inspectionMode: snapshot ? "production-read-only-snapshot" : "database-read-only-planning",
    writesAttempted: options.apply ? totals.validRecords : 0,
    manifest: {
      total: EVERYDAY_COVERAGE_V2.length,
      reusedIdentities: EVERYDAY_COVERAGE_V2.filter((entry) => entry.reusesEuropeanEssential).length,
      newIdentityEntries: EVERYDAY_COVERAGE_V2.filter((entry) => !entry.reusesEuropeanEssential).length,
      bls: EVERYDAY_COVERAGE_V2.filter((entry) => entry.source === "bls").length,
      usdaSrLegacy: EVERYDAY_COVERAGE_V2.filter((entry) => entry.source === "usda_sr_legacy").length,
      usdaFoundation: EVERYDAY_COVERAGE_V2.filter((entry) => entry.source === "usda_foundation").length,
      aliasCounts,
      searchCases: EVERYDAY_SEARCH_CORPUS.length
    },
    snapshot: snapshot ? {
      capturedAt: snapshot.capturedAt,
      schema: snapshot.schema,
      foodCount: snapshot.foodCount,
      foodNutrientCount: snapshot.foodNutrientCount,
      totalBytes: snapshot.totalBytes
    } : undefined,
    reports,
    totals,
    sourceBinding: mustFind,
    aliasPlan: aliasPlan ? {
      aliasesToCreate: aliasPlan.aliasesToCreate,
      aliasesToUpdate: aliasPlan.aliasesToUpdate,
      targetFoodIds: aliasPlan.targetFoodIds,
      overlayEstimatedGrowthBytes: aliasPlan.items.filter((item) => item.targetKind === "food_id").length * 180,
      totalEstimatedGrowthBytes: totals.estimatedGrowthBytes + aliasPlan.items.filter((item) => item.targetKind === "food_id").length * 180
    } : undefined,
    currentSearch,
    currentLegacyCompatibility,
    projectedSearch,
    legacyCompatibility,
    legacyRegressions,
    projectedMealInput,
    collisionAudit,
    shortAliasSafety
  }, null, 2));
  if (mustFind.failed.length || totals.skippedRecords || totals.duplicateRecords ||
      projectedSearch?.categories.WRONG_TOP_RESULT || projectedSearch?.categories.MISSING ||
      legacyRegressions.length) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
