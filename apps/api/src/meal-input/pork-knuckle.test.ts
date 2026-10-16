import { describe, expect, it } from "vitest";
import { interpretMealInput } from "./interpret.js";

// Owner ticket 1b3282 (2026-10-16): "0,5 grill csülök" — the catalog's pork
// knuckle (BLS Hinterhaxe) has no piece serving, so half a knuckle needed an
// AI weight estimate and ended without one.
const haxe = { id: "bls-U693100", name: "Schwein Hintereisbein/Hinterhaxe, roh", originalName: "Schwein Hintereisbein/Hinterhaxe, roh", names: { hu: "sertés hátsó csülök (Stelze)", de: "Schweinehaxe" }, source: "bls", sourceId: "U693100", createdById: null, searchText: "schwein hintereisbein hinterhaxe roh sertes hatso csulok stelze", kcalPer100g: 222, proteinPer100g: 18, fatPer100g: 16, carbsPer100g: 0, fiberPer100g: 0, servings: [] };
const wiener = { id: "bls-wiener", name: "Wiener Würstchen", originalName: "Wiener Würstchen", names: { hu: "virsli" }, source: "bls", sourceId: "W1", createdById: null, searchText: "wiener wurstchen virsli", kcalPer100g: 290, proteinPer100g: 13, fatPer100g: 26, carbsPer100g: 1, fiberPer100g: 0, servings: [] };
const foods = [haxe, wiener];
const prisma = { foodAlias: { findMany: async () => [] }, food: { findMany: async ({ where }: any) => where.id?.in ? foods.filter((f) => where.id.in.includes(f.id)) : foods.filter((f) => (where.OR ?? []).some((o: any) => f.searchText.includes(o.searchText?.contains ?? "@@"))) } } as any;
const quantityOf = async (text: string) => { const r: any = await interpretMealInput(prisma, text); return (r.items?.[0] ?? r).quantity; };

describe("fél / 0,5 csülök", () => {
  it.each([["1 grill csülök", 600], ["0,5 grill csülök", 300], ["0.5 grill csülök", 300], ["fél grill csülök", 300]])("%s → %i g without an AI call", async (text, grams) => {
    expect(await quantityOf(text)).toMatchObject({ status: "resolved", grams, estimated: true, requiresConfirmation: false });
  });

  it("half of any typical piece weight, e.g. fél virsli", async () => {
    expect(await quantityOf("fél virsli")).toMatchObject({ status: "resolved", grams: 29.75 });
  });
});
