import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { searchFoods } from "./food-search.js";

const records = [
  { id: "chicken", name: "Roasted chicken breast", searchText: "sult csirkemell gebratene hahnchenbrust roasted chicken breast csirke huhn chicken" },
  { id: "egg", name: "Fried egg", searchText: "tukortojas spiegelei fried egg sult tojas ei" }
];
const prisma = { food: { findMany: async ({ where, take }: any) => records.filter((food) => food.searchText.includes(where.searchText.contains)).slice(0, take) } } as unknown as Pick<PrismaClient, "food">;

describe("food search", () => {
  it.each([
    ["csirkemell", "chicken"],
    ["Hähnchenbrust", "chicken"],
    ["chicken breast", "chicken"],
    ["tukortojas", "egg"],
    ["csirke", "chicken"]
  ])("finds %s", async (query, id) => expect((await searchFoods(prisma, query))[0]?.id).toBe(id));

  it("returns no foods for an unknown query", async () => expect(await searchFoods(prisma, "quinoa-pizza")).toEqual([]));
  it("does not query the catalog below two characters", async () => expect(await searchFoods(prisma, "c")).toEqual([]));
});
