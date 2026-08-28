import type { Prisma } from "@prisma/client";

export type SeedServing = {
  key: string;
  unit: string;
  labels: Record<string, string>;
  grams: number;
  isEstimated?: boolean;
  confidence?: number;
  provenance: Prisma.InputJsonValue;
};

type FoodServingStore = {
  upsert(args: {
    where: { foodId_key: { foodId: string; key: string } };
    update: Omit<SeedServing, "key"> & { isEstimated: boolean; confidence: number };
    create: SeedServing & { foodId: string; isEstimated: boolean; confidence: number };
  }): Promise<unknown>;
};

export async function upsertSeedServings(store: FoodServingStore, foodId: string, servings: readonly SeedServing[]) {
  for (const serving of servings) {
    const values = {
      unit: serving.unit,
      labels: serving.labels,
      grams: serving.grams,
      isEstimated: serving.isEstimated ?? false,
      confidence: serving.confidence ?? 1,
      provenance: serving.provenance
    };
    await store.upsert({
      where: { foodId_key: { foodId, key: serving.key } },
      update: values,
      create: { foodId, key: serving.key, ...values }
    });
  }
}
