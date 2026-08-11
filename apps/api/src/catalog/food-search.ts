import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";

export async function searchFoods(prisma: Pick<PrismaClient, "food">, rawQuery: string, limit = 20) {
  const query = normalizeSearch(rawQuery);
  if (query.length < 2) return [];

  return prisma.food.findMany({
    where: { createdById: null, searchText: { contains: query, mode: "insensitive" } },
    take: Math.min(Math.max(limit, 1), 30),
    orderBy: [{ name: "asc" }]
  });
}
