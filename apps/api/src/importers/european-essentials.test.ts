import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import { EuropeanEssentialsAdapter, auditEssentialSearchCoverage } from "./european-essentials-adapter.js";
import { EUROPEAN_ESSENTIALS, EUROPEAN_ESSENTIAL_MUST_FIND } from "./european-essentials-manifest.js";
import type { ImportFood } from "./types.js";

let temporary: string | undefined;
afterEach(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); temporary = undefined; });

const fakeFood = (entry: (typeof EUROPEAN_ESSENTIALS)[number]): ImportFood => ({
  source: entry.source === "bls" ? "bls" : "usda_fdc",
  sourceId: entry.sourceId,
  originalName: entry.expectedNameTokens.join(" "),
  name: entry.expectedNameTokens.join(" "),
  names: entry.source === "bls" ? { de: entry.label } : { en: entry.label },
  synonyms: { [entry.source === "bls" ? "de" : "en"]: [entry.label, ...entry.synonyms] },
  kcalPer100g: 1,
  proteinPer100g: 1,
  fatPer100g: 1,
  carbsPer100g: 1,
  fiberPer100g: 1,
  provenance: { source: "test" },
  nutrients: []
});

describe("European essentials manifest", () => {
  it("contains 100 unique, source-bound essentials with BLS primary", () => {
    expect(EUROPEAN_ESSENTIALS).toHaveLength(100);
    expect(new Set(EUROPEAN_ESSENTIALS.map((entry) => `${entry.source}:${entry.sourceId}`)).size).toBe(100);
    expect(EUROPEAN_ESSENTIALS.filter((entry) => entry.source === "bls")).toHaveLength(97);
    expect(EUROPEAN_ESSENTIALS.filter((entry) => entry.source === "usda_sr_legacy")).toHaveLength(3);
    expect(EUROPEAN_ESSENTIALS.find((entry) => entry.key === "tempeh")).toMatchObject({ source: "usda_sr_legacy", sourceId: "174272" });
  });

  it("has exactly 100 deterministic must-find cases including mandatory, accentless and partial queries", () => {
    expect(EUROPEAN_ESSENTIAL_MUST_FIND).toHaveLength(100);
    for (const query of ["Brokkoli", "Gurke", "Knoblauch", "Kabeljau", "Thunfisch", "Birne", "hahnchen", "kase", "zucch"]) {
      expect(EUROPEAN_ESSENTIAL_MUST_FIND.some((item) => item.query === query)).toBe(true);
    }
    expect(auditEssentialSearchCoverage(EUROPEAN_ESSENTIALS.map(fakeFood))).toEqual({ total: 100, passed: 100, failed: [] });
  });

  it("rejects an approved source ID when its source name does not match", async () => {
    temporary = await mkdtemp(join(tmpdir(), "essentials-test-"));
    const file = join(temporary, "bls.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("BLS");
    sheet.addRow(["BLS Code", "Lebensmittelbezeichnung", "ENERCC Energie [kcal/100g]", "PROT625 Protein [g/100g]", "FAT Fett [g/100g]", "CHO Kohlenhydrate [g/100g]"]);
    sheet.addRow(["G312100", "Nicht Broccoli", 34, 2.8, .4, 7]);
    await workbook.xlsx.writeFile(file);
    const broccoli = EUROPEAN_ESSENTIALS.filter((entry) => entry.key === "broccoli");
    const rows = [];
    for await (const row of new EuropeanEssentialsAdapter("bls", broccoli).read(file)) rows.push(row);
    expect(rows.some((row) => "error" in row && row.error.includes("source name does not match"))).toBe(true);
    expect(rows.some((row) => "food" in row)).toBe(false);
  });
});
