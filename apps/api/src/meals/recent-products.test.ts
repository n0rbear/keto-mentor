import { describe, expect, it, vi } from "vitest";
import { recentProducts } from "./recent-products.js";

describe("legutóbbi termékek", () => {
  it("returns the user's most recently logged barcode products, newest first, each once", async () => {
    const findItems = vi.fn(async () => [{ foodId: "cola" }, { foodId: "skyr" }, { foodId: "cola" }, { foodId: "nuts" }]);
    const prisma = {
      mealItem: { findMany: findItems },
      food: { findMany: vi.fn(async () => [{ id: "nuts", barcode: "3" }, { id: "cola", barcode: "1" }, { id: "skyr", barcode: "2" }]) }
    };
    const foods = await recentProducts(prisma, "u1", 2);
    expect(foods.map((f: any) => f.id)).toEqual(["cola", "skyr"]);
    const args = (findItems.mock.calls[0] as any[])[0];
    expect(args.where).toMatchObject({ meal: { userId: "u1" }, food: { barcode: { not: null } } });
  });

  it("returns nothing without logged products, without a second query", async () => {
    const foodQuery = vi.fn();
    expect(await recentProducts({ mealItem: { findMany: async () => [] }, food: { findMany: foodQuery } }, "u1")).toEqual([]);
    expect(foodQuery).not.toHaveBeenCalled();
  });
});
