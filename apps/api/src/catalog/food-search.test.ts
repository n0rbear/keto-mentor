import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { expandFoodQuery, searchFoods } from "./food-search.js";
import { normalizeSearch } from "./normalize.js";

const records = [
  { id: "chicken", name: "Roasted chicken breast", originalName: "Chicken breast", names: { hu: "Sült csirkemell" }, searchText: "sult csirkemell gebratene hahnchenbrust roasted chicken breast csirke huhn chicken", servings: [] },
  { id: "egg", name: "Fried egg", originalName: "Egg, fried", names: { hu: "Tükörtojás" }, searchText: "tukortojas spiegelei fried egg sult tojas ei", servings: [] },
  { id: "cucumber", name: "Gurke roh", originalName: "Gurke roh", names: { de: "Gurke" }, searchText: "gurke roh cucumber uborka", servings: [] }
];
const prisma = {
  foodAlias: { findMany: async () => [] },
  food: { findMany: async ({ where, take = 90 }: any) => {
    if (where.id?.in) return records.filter((food) => where.id.in.includes(food.id));
    const queries = where.OR.map((clause: any) => clause.searchText.contains);
    return records.filter((food) => queries.some((query: string) => food.searchText.includes(query))).slice(0, take);
  } }
} as unknown as Pick<PrismaClient, "food" | "foodAlias">;

describe("food search resolver", () => {
  it.each([
    ["csirkemell", "chicken"], ["Hähnchenbrust", "chicken"], ["chicken breast", "chicken"],
    ["tukortojas", "egg"], ["sült tojás", "egg"], ["kígyóuborka", "cucumber"], ["uborka", "cucumber"]
  ])("finds %s", async (query, id) => expect((await searchFoods(prisma, query))[0]?.id).toBe(id));

  it("expands known prepared-food terms without inventing a match", () => expect(expandFoodQuery("tojásrántotta")).toEqual(["tojasrantotta", "ruhrei", "scrambled egg"]));
  it("ranks exact localized names before partial matches", async () => expect((await searchFoods(prisma, "Tükörtojás"))[0]?.match.stage).toBe("exact"));
  it("returns no foods for an unknown query", async () => expect(await searchFoods(prisma, "quinoa-pizza")).toEqual([]));
  it("does not query the catalog below two characters", async () => expect(await searchFoods(prisma, "c")).toEqual([]));
  it("ranks an exact alias above a longer alias that merely contains the query", async () => {
    const eggRecords = [
      { id: "base", name: "Egg", originalName: "Egg, whole, raw", names: { en: "Egg" }, searchText: "egg eggs", servings: [] },
      { id: "scrambled", name: "Scrambled egg", originalName: "Egg, scrambled", names: { en: "Scrambled egg" }, searchText: "scrambled egg eggs scrambled", servings: [] }
    ];
    const aliases = [
      { foodId: "base", normalizedAlias: "eggs" },
      { foodId: "scrambled", normalizedAlias: "eggs scrambled" }
    ];
    const exactAliasPrisma = {
      foodAlias: { findMany: async () => aliases },
      food: { findMany: async ({ where }: any) => where.id?.in ? eggRecords.filter((food) => where.id.in.includes(food.id)) : eggRecords }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;

    const result = await searchFoods(exactAliasPrisma, "eggs");
    expect(result.map((food) => food.id)).toEqual(["base", "scrambled"]);
    expect(result[0].match).toMatchObject({ stage: "alias", score: 95 });
    expect(result[1].match.score).toBeLessThan(result[0].match.score);
  });
  it("normalizes German sharp s and accents", () => expect(normalizeSearch("Weißkohl Süßrahmbutter")).toBe("weisskohl sussrahmbutter"));
});
