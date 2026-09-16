import { describe, expect, it } from "vitest";
import { editPrivateFood } from "./edit-private-food.js";

function fakePrisma(seedFoods: any[]) {
  const foods = [...seedFoods];
  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.id === where.id) ?? null,
      update: async ({ where, data }: any) => {
        const food = foods.find((f) => f.id === where.id)!;
        Object.assign(food, data);
        return food;
      }
    }
  };
  return { prisma, foods };
}

const newValues = { kcalPer100g: 100, proteinPer100g: 20, fatPer100g: 3, carbsPer100g: 0, fiberPer100g: 0 };

describe("editPrivateFood", () => {
  it("allows the owning user to edit their own ai_estimated Food, and transitions its source to user_input (Part P)", async () => {
    const { prisma, foods } = fakePrisma([{ id: "f1", createdById: "user-1", source: "ai_estimated", name: "Old name", provenance: { method: "ai_estimated" } }]);
    const updated = await editPrivateFood(prisma, "user-1", "f1", newValues);
    expect(updated.source).toBe("user_input");
    expect(updated.kcalPer100g).toBe(100);
    expect(updated.provenance).toMatchObject({ method: "user_edited", previousSource: "ai_estimated" });
    expect(foods[0].source).toBe("user_input"); // no longer reads as an AI estimate
  });

  it("allows the owning user to edit their own user_input Food (correcting a manual entry)", async () => {
    const { prisma } = fakePrisma([{ id: "f1", createdById: "user-1", source: "user_input", name: "Old name", provenance: null }]);
    const updated = await editPrivateFood(prisma, "user-1", "f1", newValues);
    expect(updated.source).toBe("user_input");
    expect(updated.kcalPer100g).toBe(100);
  });

  it("P0: rejects editing when the requesting user does not own the Food (cross-user isolation)", async () => {
    const { prisma, foods } = fakePrisma([{ id: "f1", createdById: "user-A", source: "ai_estimated", name: "X" }]);
    await expect(editPrivateFood(prisma, "user-B", "f1", newValues)).rejects.toMatchObject({ publicCode: "food_not_found", status: 404 });
    expect(foods[0].kcalPer100g).toBeUndefined(); // untouched
  });

  it("returns a safe not-found for a nonexistent food id (never leaks existence of another user's food)", async () => {
    const { prisma } = fakePrisma([]);
    await expect(editPrivateFood(prisma, "user-1", "missing", newValues)).rejects.toMatchObject({ publicCode: "food_not_found" });
  });

  it.each(["bls", "usda_fdc", "open_food_facts", "web_evidence", "manufacturer", "open_database", "barcode", "ai_ocr"])(
    "P0 catalog-integrity guard: rejects editing a %s Food even if createdById somehow matched",
    async (source) => {
      const { prisma } = fakePrisma([{ id: "f1", createdById: "user-1", source, name: "X" }]);
      await expect(editPrivateFood(prisma, "user-1", "f1", newValues)).rejects.toMatchObject({ publicCode: "food_not_editable", status: 403 });
    }
  );

  it("preserves prior provenance fields rather than discarding them", async () => {
    const { prisma } = fakePrisma([{ id: "f1", createdById: "user-1", source: "ai_estimated", name: "X", provenance: { method: "ai_estimated", requestedIdentity: "kárász", confidence: "low" } }]);
    const updated = await editPrivateFood(prisma, "user-1", "f1", newValues);
    expect(updated.provenance).toMatchObject({ requestedIdentity: "kárász" });
  });

  it("updates the display name only when explicitly provided", async () => {
    const { prisma } = fakePrisma([{ id: "f1", createdById: "user-1", source: "user_input", name: "Old name" }]);
    const updated = await editPrivateFood(prisma, "user-1", "f1", { ...newValues, name: "New name" });
    expect(updated.name).toBe("New name");
    expect(updated.originalName).toBe("New name");
  });
});
