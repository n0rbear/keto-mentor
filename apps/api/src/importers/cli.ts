import { resolve } from "node:path";
import { prisma } from "../db.js";
import { BlsAdapter } from "./bls-adapter.js";
import { importFoods } from "./import-foods.js";
import { UsdaFoodDataCentralAdapter } from "./usda-adapter.js";

const args = process.argv.slice(2);
const sourceName = args[0]; const fileArg = args[1];
const value = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
const dryRun = args.includes("--dry-run");
const batchSize = Number(value("--batch-size") ?? 100);
const maxRecords = value("--max-records") ? Number(value("--max-records")) : undefined;
const pilot = value("--pilot") ? Number(value("--pilot")) : undefined;
if (!sourceName || !fileArg || !["usda-foundation", "usda-sr-legacy", "bls"].includes(sourceName)) throw new Error("Usage: catalog:import <usda-foundation|usda-sr-legacy|bls> <extracted-dir|xlsx> [--dry-run] [--pilot N] [--max-records N] [--batch-size N]");
const adapter = sourceName === "bls" ? new BlsAdapter("4.0 (2025)", pilot) : new UsdaFoodDataCentralAdapter(sourceName === "usda-foundation" ? "foundation" : "sr_legacy", sourceName === "usda-foundation" ? "2026-04-30" : "2018-04", pilot);

try {
  const report = await importFoods(prisma, adapter, resolve(fileArg), { dryRun, batchSize, maxRecords, onProgress: (current) => console.error(JSON.stringify({ event: "catalog_import_progress", processed: current.processed, valid: current.validRecords, skipped: current.skippedRecords })) });
  console.log(JSON.stringify(report, null, 2));
} finally { await prisma.$disconnect(); }
