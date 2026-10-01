// Writes an insert-only migration for selected official BLS 4.0 records, so
// reference dishes can link foods that are not yet in the production catalog.
// Values come from the BLS xlsx through BlsAdapter (same carb conversion and
// provenance as a regular import); only the names and synonyms are curated.
//
//   npx tsx src/importers/bls-migration-sql.ts <BLS.xlsx> <spec.json> <migration.sql> <via>
//
// spec.json: [{ "sourceId": "G710100", "names": { "hu": "zöldbab", "en": "green beans" },
//               "synonyms": { "hu": ["..."], "de": ["..."], "en": ["..."] } }]
import { readFile, writeFile } from "node:fs/promises";
import { buildSearchText } from "../catalog/normalize.js";
import { BlsAdapter } from "./bls-adapter.js";
import { aliasesForImportedFood } from "./import-foods.js";
import type { ImportFood } from "./types.js";

export type BlsMigrationSpec = { sourceId: string; names: Record<string, string>; synonyms?: Record<string, string[]> };

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
const json = (value: unknown) => `${q(JSON.stringify(value))}::jsonb`;
const where = (sourceId: string) => `WHERE f."source" = 'bls' AND f."sourceId" = ${q(sourceId)}`;

export function blsMigrationSql(food: ImportFood, via: string): string {
  const provenance = { method: "curated_import", source: "bls", sourceId: food.sourceId, via };
  const lines = [
    `-- ${food.sourceId} ${food.originalName}: ${food.kcalPer100g} kcal, P ${food.proteinPer100g}, F ${food.fatPer100g}, carbs(total) ${food.carbsPer100g}, fiber ${food.fiberPer100g}`,
    "",
    `INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")`,
    `VALUES (${q(`bls-${food.sourceId}`)}, ${q(food.name)}, ${json(food.names)}, ${json(food.synonyms ?? {})}, 'bls', ${q(food.sourceId)}, ${q(food.originalName ?? food.name)}, ${q(food.category ?? "")}, ${q(buildSearchText(food))}, ${json(food.provenance)}, ${food.kcalPer100g}, ${food.fatPer100g}, ${food.proteinPer100g}, ${food.carbsPer100g}, ${food.fiberPer100g})`,
    `ON CONFLICT ("source", "sourceId") DO NOTHING;`,
    ""
  ];
  for (const alias of aliasesForImportedFood(food)) {
    lines.push(
      `INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")`,
      `SELECT ${q(`bls-${food.sourceId}-${alias.locale}-${alias.normalizedAlias.replace(/\s+/g, "_")}`)}, f."id", ${q(alias.alias)}, ${q(alias.normalizedAlias)}, ${q(alias.locale)}, ${q(alias.kind)}, 1, ${json(provenance)}`,
      `FROM "ketomentor"."Food" f ${where(food.sourceId)}`,
      `ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;`,
      ""
    );
  }
  for (const nutrient of [...food.nutrients].sort((a, b) => a.key.localeCompare(b.key))) {
    lines.push(
      `INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES (${q(`nutrient-${nutrient.key}`)}, ${q(nutrient.key)}, ${q(nutrient.label)}, ${q(nutrient.unit)}, ${q(nutrient.group)}) ON CONFLICT ("key") DO NOTHING;`,
      `INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")`,
      `SELECT f."id", n."id", ${nutrient.amountPer100g} FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n`,
      `${where(food.sourceId)} AND n."key" = ${q(nutrient.key)}`,
      `ON CONFLICT ("foodId", "nutrientId") DO NOTHING;`,
      ""
    );
  }
  return lines.join("\n");
}

export async function readBlsFoods(xlsx: string, specs: BlsMigrationSpec[]): Promise<ImportFood[]> {
  const bySource = new Map(specs.map((spec) => [spec.sourceId, spec]));
  const foods: ImportFood[] = [];
  for await (const row of new BlsAdapter(undefined, undefined, new Set(bySource.keys())).read(xlsx)) {
    if (!("food" in row)) throw new Error(`BLS ${row.sourceId}: ${row.error}`);
    const spec = bySource.get(row.food.sourceId)!;
    foods.push({ ...row.food, names: { ...row.food.names, ...spec.names }, synonyms: spec.synonyms });
  }
  const missing = specs.filter((spec) => !foods.some((food) => food.sourceId === spec.sourceId));
  if (missing.length) throw new Error(`not in the BLS file: ${missing.map((spec) => spec.sourceId).join(", ")}`);
  return specs.map((spec) => foods.find((food) => food.sourceId === spec.sourceId)!);
}

async function main() {
  const [xlsx, specPath, out, via] = process.argv.slice(2);
  if (!xlsx || !specPath || !out || !via) throw new Error("usage: bls-migration-sql.ts <BLS.xlsx> <spec.json> <migration.sql> <via>");
  const specs = JSON.parse(await readFile(specPath, "utf8")) as BlsMigrationSpec[];
  const foods = await readBlsFoods(xlsx, specs);
  const header = await readFile(out, "utf8").catch(() => "");
  const body = foods.map((food) => blsMigrationSql(food, via)).join("\n");
  await writeFile(out, `${header.split("\n-- BEGIN GENERATED")[0].trimEnd()}\n\n-- BEGIN GENERATED (bls-migration-sql.ts)\n\n${body}`, "utf8");
  console.log(`${foods.length} BLS foods -> ${out}`);
}

if (process.argv[1]?.endsWith("bls-migration-sql.ts")) main().catch((error) => { console.error(error); process.exit(1); });
