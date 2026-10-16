import express from "express";

// "Legutóbbi termékek" (owner request 2026-10-16): the packaged products
// (foods with a barcode) the user logged most recently, newest first, so a
// product bought again is one tap away instead of another scan.
export const RECENT_PRODUCTS_LIMIT = 8;

type Db = any;

export async function recentProducts(prisma: Db, userId: string, limit = RECENT_PRODUCTS_LIMIT) {
  const items: Array<{ foodId: string | null }> = await prisma.mealItem.findMany({
    where: { meal: { userId }, foodId: { not: null }, food: { barcode: { not: null } } },
    orderBy: [{ meal: { eatenAt: "desc" } }, { id: "desc" }],
    take: 80,
    select: { foodId: true }
  });
  const ids = [...new Set(items.map((i) => i.foodId).filter((id): id is string => !!id))].slice(0, limit);
  if (!ids.length) return [];
  const foods: any[] = await prisma.food.findMany({ where: { id: { in: ids } }, include: { servings: true } });
  const byId = new Map(foods.map((f) => [f.id, f]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export function recentProductsRouter(deps: { prisma: Db; requireAuth: express.RequestHandler }) {
  const router = express.Router();
  router.get("/me/recent-products", deps.requireAuth, async (req, res, next) => {
    try { res.json({ foods: await recentProducts(deps.prisma, req.user!.id) }); } catch (error) { next(error); }
  });
  return router;
}
