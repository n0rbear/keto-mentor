import { resolve } from "node:path";
import { prisma } from "../db.js";
import { assertProductionDatabaseSchema } from "../database-url.js";
import { EuropeanEssentialsAdapter, auditEssentialSearchCoverage } from "./european-essentials-adapter.js";
import { EUROPEAN_ESSENTIALS } from "./european-essentials-manifest.js";
import { importFoods } from "./import-foods.js";

const args = process.argv.slice(2);
const value = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
const blsFile = value("--bls");
const srDirectory = value("--usda-sr");
const apply = args.includes("--apply");
const confirmation = value("--confirm");
const batchSize = Number(value("--batch-size") ?? 75);

if (!blsFile || !srDirectory) {
  throw new Error("Usage: catalog:essentials --bls <BLS xlsx> --usda-sr <SR Legacy dir> [--batch-size 50-100] [--apply --confirm european-essentials]");
}
if (!Number.isInteger(batchSize) || batchSize < 50 || batchSize > 100) throw new Error("batch size must be an integer from 50 to 100");
if (apply && confirmation !== "european-essentials") throw new Error("write mode requires --apply --confirm european-essentials");
if (apply) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required in write mode");
  assertProductionDatabaseSchema(databaseUrl, "production");
}

const adapters = [
  { adapter: new EuropeanEssentialsAdapter("bls"), path: resolve(blsFile) },
  { adapter: new EuropeanEssentialsAdapter("usda_sr_legacy"), path: resolve(srDirectory) }
];

try {
  const reports = [];
  const foods = [];
  for (const { adapter, path } of adapters) {
    const report = await importFoods(prisma, adapter, path, {
      dryRun: !apply,
      batchSize,
      onProgress: (current) => console.error(JSON.stringify({
        event: "european_essentials_progress",
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
  const searchAudit = auditEssentialSearchCoverage(foods);
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

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    manifest: {
      total: EUROPEAN_ESSENTIALS.length,
      bls: EUROPEAN_ESSENTIALS.filter((entry) => entry.source === "bls").length,
      usdaSrLegacy: EUROPEAN_ESSENTIALS.filter((entry) => entry.source === "usda_sr_legacy").length
    },
    reports,
    totals,
    mustFind: searchAudit
  }, null, 2));
  if (searchAudit.failed.length) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
