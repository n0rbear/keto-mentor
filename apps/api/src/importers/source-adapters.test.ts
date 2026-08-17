import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import { BlsAdapter } from "./bls-adapter.js";
import { UsdaFoodDataCentralAdapter } from "./usda-adapter.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

let temporary: string | undefined;
afterEach(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); temporary = undefined; });

describe("official source adapters", () => {
  it("maps a USDA Foundation row, language and unknown nutrient policy", async () => {
    const adapter = new UsdaFoodDataCentralAdapter("foundation", "test"); const rows = []; for await (const row of adapter.read(join(fixturesDir, "usda-mini"))) rows.push(row);
    expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ food: { source: "usda_fdc", sourceId: "1", originalName: "Egg, whole, raw", names: { en: "Egg, whole, raw" }, category: "Dairy and Egg Products" } });
    if ("food" in rows[0]) expect(rows[0].food.nutrients.map((item) => item.key)).not.toContain("999999");
    expect(adapter.diagnostics).toContain("unknown USDA nutrient id skipped: 999999");
  });

  it("maps BLS German identity, macros and converted units", async () => {
    temporary = await mkdtemp(join(tmpdir(), "bls-test-")); const file = join(temporary, "bls.xlsx"); const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("BLS_4_0_Daten_2025_DE");
    sheet.addRow(["BLS Code", "Lebensmittelbezeichnung", "Food name", "ENERCC Energie (Kilokalorien) [kcal/100g]", "PROT625 Protein [g/100g]", "FAT Fett [g/100g]", "CHO Kohlenhydrate [g/100g]", "FIBT Ballaststoffe [g/100g]", "CU Kupfer [µg/100g]"]);
    sheet.addRow(["E100000", "Hühnerei roh", "Chicken egg raw", 143, 12.6, 9.5, .7, 0, 850]); await workbook.xlsx.writeFile(file);
    const rows = []; for await (const row of new BlsAdapter().read(file)) rows.push(row);
    expect(rows[0]).toMatchObject({ food: { source: "bls", sourceId: "E100000", originalName: "Hühnerei roh", names: { de: "Hühnerei roh" }, category: "Eggs" } });
    if ("food" in rows[0]) expect(rows[0].food.nutrients.find((item) => item.key === "copper")?.amountPer100g).toBe(.85);
  });
});
