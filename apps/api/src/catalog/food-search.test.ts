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
  it("normalizes German sharp s and accents", () => expect(normalizeSearch("Weißkohl Süßrahmbutter")).toBe("weisskohl sussrahmbutter"));
});
